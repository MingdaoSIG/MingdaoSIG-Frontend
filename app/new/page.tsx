"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { type ChangeEvent, useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
// Desktop Components
import PostEditorDesktop from "@/components/PostEditor/desktop/PostEditor";
// Mobile Components
import PostEditorMobile from "@/components/PostEditor/mobile/PostEditor";
import {
  DraftBar,
  DraftsDialog,
  LocalDraftOffer,
} from "@/components/PostEditor/shared/DraftBar";
import {
  addPostToSeries,
  SeriesSelect,
} from "@/components/PostEditor/shared/SeriesSelect";
import {
  draftFields,
  useCloudDraft,
} from "@/components/PostEditor/shared/useCloudDraft";
import type { TDraft, TDraftSummary } from "@/interfaces/Reading";
import { CustomStatus } from "@/modules/customStatusCode";
import {
  deleteDraft,
  draftKeys,
  getDraft,
  localDraftOffered,
  markLocalDraftOffered,
  rememberDraft,
  rememberedDraft,
  saveDraft,
} from "@/modules/drafts";
// Modules
import { imageUpload } from "@/modules/imageUploadAPI";
import { useUserSeries } from "@/modules/series";
import { isValidObjectId } from "@/modules/validation";
import { promptLogin } from "@/utils/loginPrompt";
import { notice } from "@/utils/notice";
import { storageGet, storageRemove, storageSet } from "@/utils/safeStorage";
// Utils
import useIsMobile from "@/utils/useIsMobile";
import { useUserAccount } from "@/utils/useUserAccount";
// Configs
import { alertMessageConfigs } from "../../components/PostEditor/config/alertMessages";
import {
  isDefaultContent,
  markdownGuide,
} from "../../components/PostEditor/config/markdownGuide";
// Types
import type { TPostAPI } from "../../components/PostEditor/types/postAPI";
// APIs Request Function
import { postAPI } from "./(new)/apis/postAPI";

// 驗證 localStorage 資料的類型
type PostDataSchema = {
  title?: string;
  sig?: string;
  content?: string;
  cover?: string;
  hashtag?: string[];
};

// 驗證並清理 localStorage 資料
function validateStoredData(data: unknown): Partial<TPostAPI> {
  if (typeof data !== "object" || data === null) {
    return {};
  }

  const result: Partial<TPostAPI> = {};
  const typedData = data as PostDataSchema;

  // 驗證 title
  if (typeof typedData.title === "string" && typedData.title.length <= 200) {
    result.title = typedData.title;
  }

  // 驗證 sig（必須是有效的 ObjectId 格式）
  if (typeof typedData.sig === "string" && isValidObjectId(typedData.sig)) {
    result.sig = typedData.sig;
  }

  // 驗證 content
  if (
    typeof typedData.content === "string" &&
    typedData.content.length <= 100000
  ) {
    result.content = typedData.content;
  }

  // 驗證 cover（接受 image ID 或完整 URL）
  if (typeof typedData.cover === "string" && typedData.cover.length > 0) {
    result.cover = typedData.cover;
  }

  // 驗證 hashtag（必須是字串陣列）
  if (Array.isArray(typedData.hashtag)) {
    result.hashtag = typedData.hashtag.filter(
      (tag): tag is string => typeof tag === "string" && tag.length <= 50,
    );
  }

  return result;
}

const EMPTY_POST: TPostAPI = {
  title: "",
  sig: "",
  content: markdownGuide,
  cover: "",
  hashtag: [],
};

/** Nothing typed yet: not worth a draft (local or cloud). */
function isBlank(data: TPostAPI) {
  return (
    data.title === "" &&
    data.sig === "" &&
    data.cover === "" &&
    (data.hashtag?.length ?? 0) === 0 &&
    isDefaultContent(data.content)
  );
}

/** The draft kept on this device (logged-out writing), or null. */
function readLocalDraft(): TPostAPI | null {
  const storedContent = storageGet("editorContent");
  const storedData = storageGet("postData");
  let loaded: Partial<TPostAPI> = {};
  if (storedContent && !isDefaultContent(storedContent)) {
    loaded.content = storedContent;
  }
  if (storedData) {
    try {
      const validated = validateStoredData(JSON.parse(storedData));
      if (isDefaultContent(validated.content)) {
        // Drafts from older versions still hold the English sample.
        validated.content = markdownGuide;
      }
      loaded = { ...loaded, ...validated };
    } catch (error) {
      console.error("Failed to parse stored post data:", error);
      storageRemove("postData");
    }
  }
  if (Object.keys(loaded).length === 0) {
    return null;
  }
  return { ...EMPTY_POST, ...loaded };
}

function fromDraft(draft: TDraft): TPostAPI {
  return {
    title: draft.title,
    sig: draft.sig,
    content: draft.content || markdownGuide,
    cover: draft.cover,
    hashtag: draft.hashtag,
  };
}

/** `?draft=<id>` (the drafts list links here), removed once read. */
function takeDraftParam() {
  const url = new URL(window.location.href);
  const id = url.searchParams.get("draft");
  if (!id) {
    return null;
  }
  url.searchParams.delete("draft");
  window.history.replaceState(null, "", `${url.pathname}${url.search}`);
  return isValidObjectId(id) ? id : null;
}

export default function NewPostPage() {
  const { status } = useSession();
  const {
    token,
    isLoading: authLoading,
    isLogin,
    userData,
    login,
  } = useUserAccount();
  const route = useRouter();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const userId = isLogin ? (userData?._id ?? "") : "";
  // Decided once, when the login is known: signed in, drafts live in the
  // cloud; logged out, on this device (as before).
  const [mode, setMode] = useState<"local" | "cloud" | null>(null);
  const [draftsOpen, setDraftsOpen] = useState(false);
  const [localOffer, setLocalOffer] = useState<TPostAPI | null>(null);
  const [offerBusy, setOfferBusy] = useState(false);
  const [seriesId, setSeriesId] = useState("");
  const mySeries = useUserSeries(userId || null);

  // ✅ 使用 ref 追蹤是否已經初始化，避免重複清除
  const hasLoadedFromStorage = useRef(false);

  const [postButtonDisable, setPostButtonDisable] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [data, setPostData] = useState<TPostAPI>(EMPTY_POST);
  const cloud = useCloudDraft({
    enabled: mode === "cloud" && isInitialized,
    data,
    post: null,
    token,
    skip: isBlank,
  });

  // A new draft id (first save) is remembered for the next visit.
  useEffect(() => {
    if (mode === "cloud" && cloud.draftId) {
      rememberDraft(userId, cloud.draftId);
    }
  }, [mode, cloud.draftId, userId]);

  function handleFormChange(e: {
    target: { name: string; value: string | string[] };
  }) {
    setPostData(
      (prev: TPostAPI | undefined) =>
        ({
          ...prev,
          [e.target.name]: e.target.value,
        }) as TPostAPI,
    );
  }

  // ✅ 修復：只在真正有內容變化時才保存（只在未登入時存在這台裝置）
  useEffect(() => {
    if (!isInitialized || !hasLoadedFromStorage.current || mode !== "local") {
      return;
    }

    const hasContent =
      data.title !== "" ||
      data.sig !== "" ||
      (data.hashtag && data.hashtag.length > 0) ||
      !isDefaultContent(data.content);

    if (hasContent) {
      storageSet("postData", JSON.stringify(data));
    }
    // ⚠️ 不要在這裡刪除 postData，讓用戶手動 discard
  }, [data, isInitialized, mode]);

  // Once the login is known, load what the editor starts from: logged out,
  // the draft on this device (as before); signed in, the cloud draft from
  // `?draft=` or the one this user was last writing, and offer once to
  // upload the draft on this device.
  useEffect(() => {
    if (hasLoadedFromStorage.current || authLoading) {
      return;
    }
    hasLoadedFromStorage.current = true;

    if (!isLogin || !userId) {
      setMode("local");
      const local = readLocalDraft();
      if (local) {
        setPostData(local);
      }
      setIsInitialized(true);
      return;
    }

    setMode("cloud");
    const local = readLocalDraft();
    if (local && !isBlank(local) && !localDraftOffered(userId)) {
      setLocalOffer(local);
    }
    const id = takeDraftParam() ?? rememberedDraft(userId);
    if (!id) {
      cloud.adopt(null, EMPTY_POST);
      setIsInitialized(true);
      return;
    }
    (async () => {
      const result = await getDraft(id);
      if (result.ok && result.data) {
        const draft = result.data;
        if (draft.post) {
          // A draft of an existing post belongs to its edit page.
          route.replace(`/post/${draft.post}/edit?draft=${draft._id}`);
          return;
        }
        const shown = fromDraft(draft);
        setPostData(shown);
        cloud.adopt(draft._id, shown, draft.updatedAt);
        rememberDraft(userId, draft._id);
      } else {
        if (!result.ok && result.kind === "not-found") {
          rememberDraft(userId, null);
        } else if (!result.ok) {
          notice("error", `雲端草稿載入失敗：${result.message}`);
        }
        cloud.adopt(null, EMPTY_POST);
      }
      setIsInitialized(true);
    })();
  }, [authLoading, isLogin, userId]);

  /** Shows a cloud draft in the editor (from the 「草稿」 list). */
  async function resumeDraft(summary: TDraftSummary) {
    if (summary.post) {
      setDraftsOpen(false);
      route.push(`/post/${summary.post}/edit?draft=${summary._id}`);
      return;
    }
    await cloud.flush();
    await cloud.pause();
    const result = await getDraft(summary._id);
    if (!result.ok || !result.data) {
      cloud.resume();
      notice(
        "error",
        `草稿載入失敗：${result.ok ? "找不到草稿" : result.message}`,
      );
      return;
    }
    const shown = fromDraft(result.data);
    setPostData(shown);
    cloud.adopt(result.data._id, shown, result.data.updatedAt);
    rememberDraft(userId, result.data._id);
    cloud.resume();
    setDraftsOpen(false);
    void queryClient.invalidateQueries({ queryKey: draftKeys.list(userId) });
  }

  /** 「開新草稿」: keeps the current draft and starts an empty one. */
  async function newDraft() {
    await cloud.flush();
    await cloud.pause();
    setPostData(EMPTY_POST);
    setSeriesId("");
    cloud.adopt(null, EMPTY_POST);
    rememberDraft(userId, null);
    cloud.resume();
    setDraftsOpen(false);
    void queryClient.invalidateQueries({ queryKey: draftKeys.list(userId) });
  }

  function onDraftDeleted(id: string) {
    if (id === cloud.currentId()) {
      // The editor keeps the text; the next change starts a new draft.
      cloud.adopt(null, data);
      rememberDraft(userId, null);
    }
    if (cloud.status.kind === "full") {
      cloud.retry();
    }
  }

  async function uploadLocalDraft() {
    if (!localOffer) {
      return;
    }
    setOfferBusy(true);
    const result = await saveDraft(null, draftFields(localOffer, null));
    setOfferBusy(false);
    if (!result.ok) {
      notice(
        "error",
        result.status === CustomStatus.CONTENT_SIZE_EXCEEDED
          ? "雲端草稿已滿（最多 20 份），請先刪除不需要的草稿"
          : `沒有存到雲端：${result.message}`,
      );
      return;
    }
    storageRemove("editorContent");
    storageRemove("postData");
    markLocalDraftOffered(userId);
    const local = localOffer;
    setLocalOffer(null);
    void queryClient.invalidateQueries({ queryKey: draftKeys.list(userId) });
    if (isBlank(data) && !cloud.currentId() && result.data.id) {
      await cloud.pause();
      setPostData(local);
      cloud.adopt(result.data.id, local, new Date().toISOString());
      rememberDraft(userId, result.data.id);
      cloud.resume();
      notice("success", "已存到雲端，可以繼續寫");
      return;
    }
    notice("success", "已存到雲端草稿，可以在「草稿」中找到");
  }

  function dismissLocalDraft() {
    markLocalDraftOffered(userId);
    setLocalOffer(null);
  }

  async function NewPostAPI() {
    if (!data || authLoading) {
      return;
    }
    // Logged out: say so (and offer to log in) instead of a generic error.
    // The draft is already saved on this device.
    if (!token) {
      return promptLogin(login, {
        title: "請先登入再發文",
        text: "草稿已自動保存在這台裝置，登入後就能發布。",
      });
    }

    setPostButtonDisable(true);

    if (data?.title === "") {
      return Swal.fire(alertMessageConfigs.titleError).then(() =>
        setPostButtonDisable(false),
      );
    }
    if (!data.sig) {
      return Swal.fire(alertMessageConfigs.sigError).then(() =>
        setPostButtonDisable(false),
      );
    }

    // No autosave may land after the draft is deleted below.
    await cloud.pause();
    const res = await postAPI(data, token);

    if (res.ok) {
      const postId = res.data?._id;
      // Publishing deletes the cloud draft (contract v4 §4.5).
      const draftId = cloud.currentId();
      cloud.adopt(null, data);
      if (draftId) {
        const removed = await deleteDraft(draftId);
        if (!removed.ok && removed.kind !== "not-found") {
          console.error("Draft not deleted after publishing:", removed.message);
        }
        void queryClient.invalidateQueries({
          queryKey: draftKeys.list(userId),
        });
      }
      rememberDraft(userId, null);
      const series = mySeries.data?.find((item) => item._id === seriesId);
      if (series && postId) {
        const added = await addPostToSeries(series, postId);
        if (!added.ok) {
          notice("error", `貼文已發布，但沒有加入系列：${added.message}`);
        }
      }
      return Swal.fire(alertMessageConfigs.Success).then(() => {
        setPostButtonDisable(false);
        // ✅ 成功發布後才清除
        storageRemove("editorContent");
        storageRemove("postData");
        route.push(postId ? `/post/${postId}` : "/");
      });
    }
    cloud.resume();
    if (res.status === 4001) {
      return Swal.fire(alertMessageConfigs.PermissionError).then(() =>
        setPostButtonDisable(false),
      );
    }
    // 429, too large, server down…: say what happened; the draft is kept.
    return Swal.fire({
      ...alertMessageConfigs.OthersError,
      text: res.message,
    }).then(() => setPostButtonDisable(false));
  }

  function discard(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();

    const inCloud = mode === "cloud";
    Swal.fire({
      title: "確定要放棄嗎？",
      text: inCloud
        ? "內容會清空，這份草稿也會從雲端刪除"
        : "所有未保存的內容將會丟失",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "確定放棄",
      cancelButtonText: "取消",
      confirmButtonColor: "#b42318",
    }).then(async (result) => {
      if (!result.isConfirmed) {
        return;
      }
      if (inCloud) {
        await cloud.pause();
        const draftId = cloud.currentId();
        cloud.adopt(null, EMPTY_POST);
        rememberDraft(userId, null);
        if (draftId) {
          const removed = await deleteDraft(draftId);
          if (!removed.ok && removed.kind !== "not-found") {
            notice("error", `雲端草稿沒有刪除：${removed.message}`);
          }
          void queryClient.invalidateQueries({
            queryKey: draftKeys.list(userId),
          });
        }
        setPostData(EMPTY_POST);
        setSeriesId("");
        cloud.resume();
        return;
      }
      setPostData(EMPTY_POST);
      storageRemove("editorContent");
      storageRemove("postData");
    });
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const validImageTypes = [
      "image/webp",
      "image/jpeg",
      "image/png",
      "image/tiff",
    ];

    if (!e.target.files || e.target.files.length === 0) {
      return;
    }

    const file = e.target.files[0];
    if (!validImageTypes.includes(file.type)) {
      Swal.fire("不支援的檔案格式", "只能上傳 JPG、PNG、WebP、TIFF", "error");
      return;
    }

    if (file.size > 5 * 1000 * 1000) {
      Swal.fire("檔案太大", "圖片需小於 5MB", "error");
      return;
    }

    try {
      const imageUploadAPIResponse = await imageUpload(file, token);
      const imageUploadResponseJson = await imageUploadAPIResponse.json();
      if (!imageUploadResponseJson?.id) {
        throw new Error("Upload returned no id");
      }
      setPostData(
        (prev: TPostAPI) =>
          ({
            ...prev,
            cover: imageUploadResponseJson.id,
          }) as TPostAPI,
      );
    } catch (error) {
      console.error("error: ", error);
      Swal.fire("上傳失敗", "封面上傳失敗，請稍後再試", "error");
      return;
    }
  }

  if (status === "loading") {
    return <div className="flex h-full items-center justify-center"></div>;
  }

  const topBar =
    mode === "cloud" ? (
      <>
        {localOffer && (
          <LocalDraftOffer
            title={localOffer.title}
            busy={offerBusy}
            onUpload={uploadLocalDraft}
            onDismiss={dismissLocalDraft}
            mobile={isMobile}
          />
        )}
        <DraftBar
          status={cloud.status}
          onRetry={cloud.retry}
          onOpenList={() => setDraftsOpen(true)}
          mobile={isMobile}
        />
        <DraftsDialog
          open={draftsOpen}
          onClose={() => setDraftsOpen(false)}
          mobile={isMobile}
          userId={userId}
          currentId={cloud.draftId}
          onResume={resumeDraft}
          onNew={newDraft}
          onDeleted={onDraftDeleted}
        />
      </>
    ) : null;
  const metaExtra =
    mode === "cloud" ? (
      <SeriesSelect value={seriesId} onChange={setSeriesId} mobile={isMobile} />
    ) : null;

  return isMobile ? (
    <PostEditorMobile
      data={data}
      setPostData={setPostData}
      token={token ?? ""}
      handleFormEventFunction={handleFormChange}
      discardFunction={discard}
      postFunction={NewPostAPI}
      postButtonDisable={postButtonDisable}
      handleFileChange={handleFileChange}
      topBar={topBar}
      metaExtra={metaExtra}
    />
  ) : (
    <PostEditorDesktop
      data={data}
      setPostData={setPostData}
      discardFunction={discard}
      postFunction={NewPostAPI}
      token={token ?? ""}
      handleFormEventFunction={handleFormChange}
      postButtonDisable={postButtonDisable}
      handleFileChange={handleFileChange}
      topBar={topBar}
      metaExtra={metaExtra}
    />
  );
}

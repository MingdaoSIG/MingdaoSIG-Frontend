"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { type ChangeEvent, use, useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
// APIs Request Function
import {
  editPostAPI,
  getPostAPI,
} from "@/app/post/[postID]/edit/(edit)/apis/postAPI";
import PostEditor from "@/components/PostEditor/PostEditor";
import { addPostToSeries } from "@/components/PostEditor/shared/addPostToSeries";
import {
  DraftBar,
  DraftsDialog,
  formatClock,
} from "@/components/PostEditor/shared/DraftBar";
import { useCloudDraft } from "@/components/PostEditor/shared/useCloudDraft";
import type { TPostAPI } from "@/components/PostEditor/types/postAPI";
import type { TDraft, TDraftSummary } from "@/interfaces/Reading";
// Types
import type { TThread } from "@/interfaces/Thread";
import type { User } from "@/interfaces/User";
import { deleteDraft, draftKeys, getDraft, listDrafts } from "@/modules/drafts";
// Modules
import { imageUpload } from "@/modules/imageUploadAPI";
import { useUserSeries } from "@/modules/series";
import { isValidObjectId } from "@/modules/validation";
import { notice } from "@/utils/notice";
// Utils
import useIsMobile from "@/utils/useIsMobile";
import { useUserAccount } from "@/utils/useUserAccount";

const ADMIN_PERMISSION = 2;

const EMPTY_FORM: TPostAPI = {
  title: "",
  sig: "",
  content: "",
  cover: "",
  hashtag: [],
};

function toForm(post: TThread): TPostAPI {
  return {
    title: post.title ?? "",
    sig: typeof post.sig === "string" ? post.sig : "",
    content: post.content ?? "",
    cover: post.cover ?? "",
    hashtag: Array.isArray(post.hashtag) ? post.hashtag : [],
  };
}

function sameForm(a: TPostAPI, b: TPostAPI) {
  return (
    a.content === b.content &&
    a.title === b.title &&
    a.sig === b.sig &&
    a.cover === b.cover &&
    a.hashtag?.toString() === b.hashtag?.toString()
  );
}

function draftForm(draft: TDraft, fallback: TPostAPI): TPostAPI {
  return {
    title: draft.title,
    sig: draft.sig || fallback.sig,
    content: draft.content,
    cover: draft.cover,
    hashtag: draft.hashtag,
  };
}

/** `?draft=<id>` from the drafts list, removed once read. */
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

function ownerOf(post: TThread) {
  const user: unknown = post.user;
  if (typeof user === "string") {
    return user;
  }
  return (user as User | null)?._id;
}

export default function EditPostPage({
  params,
}: {
  params: Promise<{ postID: string }>;
}) {
  const { postID } = use(params);
  const route = useRouter();
  const isMobile = useIsMobile();
  const { isLogin, token, userData, isLoading } = useUserAccount();

  const [oldPostData, setOldPostData] = useState<TThread | null>(null);
  const [currentPostData, setCurrentPostData] = useState<TPostAPI>(EMPTY_FORM);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  // The form is seeded from the loaded post once. Emptying a field later
  // (removing the cover, clearing the title) is an edit, not a reset.
  const seeded = useRef(false);
  const queryClient = useQueryClient();
  const userId = isLogin ? (userData?._id ?? "") : "";
  const [draftChecked, setDraftChecked] = useState(false);
  // A cloud draft of this post that is not in the form yet.
  const [pendingDraft, setPendingDraft] = useState<TDraftSummary | null>(null);
  const [draftsOpen, setDraftsOpen] = useState(false);
  const [seriesId, setSeriesId] = useState("");
  const mySeries = useUserSeries(userId || null);

  function handleFormChange(e: {
    target: { name: string; value: string | string[] };
  }) {
    setCurrentPostData(
      (prev: TPostAPI | undefined) =>
        ({
          ...prev,
          [e.target.name]: e.target.value,
        }) as TPostAPI,
    );
  }

  // `attempt` re-runs the load when the user presses retry.
  useEffect(() => {
    if (seeded.current) {
      return;
    }
    const controller = new AbortController();
    (async () => {
      const res = await getPostAPI(postID, controller.signal);
      if (controller.signal.aborted || seeded.current) {
        return;
      }
      if (res.ok && typeof res.data?._id === "string") {
        seeded.current = true;
        setOldPostData(res.data);
        setCurrentPostData(toForm(res.data));
        setLoadError(null);
      } else if (!res.ok && res.kind === "not-found") {
        route.push("/");
      } else {
        setLoadError(res.ok ? "伺服器暫時無法回應，請稍後再試" : res.message);
      }
    })();
    return () => controller.abort();
  }, [postID, attempt]);

  // The author, or an admin (the backend lets admins edit any post).
  const mayEdit = Boolean(
    oldPostData &&
      userData &&
      (ownerOf(oldPostData) === userData._id ||
        userData.permission === ADMIN_PERMISSION),
  );

  // Only judge ownership once both the post and the login are known;
  // deciding earlier bounced the real owner whenever /login answered first.
  useEffect(() => {
    if (isLoading || !oldPostData) {
      return;
    }
    if (!isLogin || !mayEdit) {
      route.push(`/post/${postID}`);
    }
  }, [oldPostData, isLoading, isLogin, mayEdit, route, postID]);

  const baseline = oldPostData ? toForm(oldPostData) : null;
  const unchanged = baseline !== null && sameForm(baseline, currentPostData);

  // Autosave edits to a cloud draft of this post (contract v4 §4.5).
  const cloud = useCloudDraft({
    enabled: Boolean(userId) && mayEdit && draftChecked,
    data: currentPostData,
    post: postID,
    token,
    skip: (form) => !baseline || sameForm(baseline, form),
  });

  // Once the post and the login are known: open `?draft=`, or look for an
  // earlier draft of this post and offer it.
  useEffect(() => {
    if (draftChecked || !oldPostData || !userId || !mayEdit) {
      return;
    }
    const original = toForm(oldPostData);
    const fromParam = takeDraftParam();
    (async () => {
      if (fromParam) {
        const result = await getDraft(fromParam);
        if (result.ok && result.data && result.data.post === postID) {
          const form = draftForm(result.data, original);
          setCurrentPostData(form);
          cloud.adopt(result.data._id, form, result.data.updatedAt);
          setDraftChecked(true);
          return;
        }
      }
      const list = await listDrafts();
      const existing = list.ok
        ? list.data
            .filter((draft) => draft.post === postID)
            .sort(
              (a, b) =>
                new Date(b.updatedAt ?? 0).getTime() -
                new Date(a.updatedAt ?? 0).getTime(),
            )[0]
        : undefined;
      // Edits go on into that draft; its content waits for 「載入草稿」.
      cloud.adopt(existing?._id ?? null, original);
      setPendingDraft(existing ?? null);
      setDraftChecked(true);
    })();
  }, [oldPostData, userId, mayEdit, draftChecked, postID]);

  async function loadPendingDraft() {
    if (!pendingDraft || !baseline) {
      return;
    }
    await cloud.pause();
    const result = await getDraft(pendingDraft._id);
    if (!result.ok || !result.data) {
      cloud.resume();
      notice(
        "error",
        `草稿載入失敗：${result.ok ? "找不到草稿" : result.message}`,
      );
      return;
    }
    const form = draftForm(result.data, baseline);
    setCurrentPostData(form);
    cloud.adopt(result.data._id, form, result.data.updatedAt);
    cloud.resume();
    setPendingDraft(null);
  }

  async function discardPendingDraft() {
    if (!pendingDraft) {
      return;
    }
    await cloud.pause();
    const result = await deleteDraft(pendingDraft._id);
    if (!result.ok && result.kind !== "not-found") {
      cloud.resume();
      notice("error", `草稿沒有刪除：${result.message}`);
      return;
    }
    cloud.adopt(null, currentPostData);
    cloud.resume();
    setPendingDraft(null);
    void queryClient.invalidateQueries({ queryKey: draftKeys.list(userId) });
  }

  /** Deletes this post's cloud draft (after 更新 or 還原). */
  async function dropDraft() {
    await cloud.pause();
    const draftId = cloud.currentId();
    cloud.adopt(null, currentPostData);
    setPendingDraft(null);
    if (draftId) {
      const result = await deleteDraft(draftId);
      if (!result.ok && result.kind !== "not-found") {
        console.error("Draft not deleted:", result.message);
      }
      void queryClient.invalidateQueries({ queryKey: draftKeys.list(userId) });
    }
  }
  // Missing title, content or SIG are shown under their fields by the
  // editor when 更新 is pressed.
  const editButtonDisable = !baseline || saving || (unchanged && !seriesId);

  async function undo() {
    const answer = await Swal.fire({
      title: "還原成目前發布的版本？",
      text: "這次的修改會清除，這篇的雲端草稿也會刪除",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "還原",
      cancelButtonText: "取消",
      confirmButtonColor: "#b42318",
    });
    if (!answer.isConfirmed) {
      return;
    }
    if (oldPostData) {
      setCurrentPostData(toForm(oldPostData));
      if (cloud.currentId()) {
        await dropDraft();
      }
      cloud.resume();
    }
  }

  async function sendEdit() {
    const result = await Swal.fire({
      title: "確定要更新這篇貼文嗎？",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "更新",
      cancelButtonText: "取消",
      confirmButtonColor: "#0b5a83",
    });
    if (!result.isConfirmed) {
      return;
    }
    setSaving(true);
    await cloud.pause();
    const res = await editPostAPI(currentPostData, postID, token ?? "");
    setSaving(false);
    if (res.ok) {
      // The update is saved: its cloud draft is done with.
      await dropDraft();
      const series = mySeries.data?.find((item) => item._id === seriesId);
      if (series) {
        const added = await addPostToSeries(series, postID);
        if (!added.ok) {
          notice("error", `貼文已更新，但沒有加入系列：${added.message}`);
        }
      }
      Swal.fire({
        title: "貼文已更新",
        icon: "success",
        confirmButtonText: "查看貼文",
        confirmButtonColor: "#0b5a83",
      }).then(() => {
        route.push(`/post/${postID}`);
      });
      return;
    }
    // The edits stay in the form, so the user can try again.
    cloud.resume();
    Swal.fire({
      title: "更新失敗",
      text: res.message,
      icon: "error",
      confirmButtonText: "好",
    });
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const validImageTypes = [
      "image/webp",
      "image/jpeg",
      "image/png",
      "image/tiff",
    ];

    if (!e.target.files) {
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
      setCurrentPostData(
        (prev: TPostAPI) =>
          ({
            ...prev,
            cover:
              `${process.env.NEXT_PUBLIC_API_URL}/image/` +
              imageUploadResponseJson.id,
          }) as TPostAPI,
      );
    } catch (error) {
      console.error("error: ", error);
      Swal.fire("上傳失敗", "封面上傳失敗，請稍後再試", "error");
      return;
    }
  }

  if (loadError) {
    return (
      <div
        role="alert"
        className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-ink-700"
      >
        <p>{loadError}</p>
        <button
          type="button"
          className="cursor-pointer rounded-control border border-line bg-surface px-4 py-2 text-sm hover:bg-field"
          onClick={() => setAttempt((n) => n + 1)}
        >
          重試
        </button>
      </div>
    );
  }

  if (isLoading || !oldPostData || !mayEdit) {
    return <div></div>;
  }

  const topBar = userId ? (
    <>
      {pendingDraft && (
        <section
          aria-label="尚未更新的草稿"
          className={`flex gap-x-4 gap-y-2 rounded-card border border-brand-700/25 bg-brand-50 px-4 py-2.5 text-ink-800 text-sm ${
            isMobile ? "flex-col" : "items-center"
          }`}
        >
          <p className={`leading-6 ${isMobile ? "" : "min-w-0 flex-1"}`}>
            這篇貼文有一份尚未更新的雲端草稿
            {pendingDraft.updatedAt
              ? `（${formatClock(new Date(pendingDraft.updatedAt))} 儲存）`
              : ""}
            。
          </p>
          <div className={`flex shrink-0 gap-2 ${isMobile ? "*:flex-1" : ""}`}>
            <button
              type="button"
              onClick={discardPendingDraft}
              className={`cursor-pointer rounded-control border border-line-strong bg-surface px-3 font-semibold text-ink-700 hover:bg-field ${
                isMobile ? "h-11" : "h-9"
              }`}
            >
              捨棄草稿
            </button>
            <button
              type="button"
              onClick={loadPendingDraft}
              className={`cursor-pointer rounded-control bg-brand-700 px-3 font-semibold text-white hover:bg-brand-800 ${
                isMobile ? "h-11" : "h-9"
              }`}
            >
              載入草稿
            </button>
          </div>
        </section>
      )}
      <DraftsDialog
        open={draftsOpen}
        onClose={() => setDraftsOpen(false)}
        mobile={isMobile}
        userId={userId}
        currentId={cloud.draftId}
        onResume={async (draft) => {
          setDraftsOpen(false);
          await cloud.flush();
          if (draft.post === postID) {
            setPendingDraft(draft);
            return;
          }
          route.push(
            draft.post
              ? `/post/${draft.post}/edit?draft=${draft._id}`
              : `/new?draft=${draft._id}`,
          );
        }}
        onNew={async () => {
          setDraftsOpen(false);
          await cloud.flush();
          route.push("/new");
        }}
        onDeleted={(id) => {
          if (id === cloud.currentId()) {
            cloud.adopt(null, currentPostData);
          }
          if (id === pendingDraft?._id) {
            setPendingDraft(null);
          }
          if (cloud.status.kind === "full") {
            cloud.retry();
          }
        }}
      />
    </>
  ) : null;
  const statusBar = userId ? (
    <DraftBar
      status={cloud.status}
      onRetry={cloud.retry}
      onOpenList={() => setDraftsOpen(true)}
      mobile={isMobile}
    />
  ) : null;

  return (
    <PostEditor
      token={token ?? ""}
      data={currentPostData}
      setPostData={setCurrentPostData}
      discardFunction={undo}
      postFunction={sendEdit}
      postButtonDisable={editButtonDisable}
      handleFormEventFunction={handleFormChange}
      handleFileChange={handleFileChange}
      isEdit
      originalSig={baseline?.sig}
      topBar={topBar}
      statusBar={statusBar}
      series={
        userId
          ? { value: seriesId, onChange: setSeriesId, postId: postID }
          : undefined
      }
    />
  );
}

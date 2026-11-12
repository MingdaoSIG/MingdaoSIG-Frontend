"use client";

import { useRouter } from "next/navigation";
import { type ChangeEvent, use, useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
// APIs Request Function
import {
  editPostAPI,
  getPostAPI,
} from "@/app/post/[postID]/edit/(edit)/apis/postAPI";
// Desktop Components
import PostEditorDesktop from "@/components/PostEditor/desktop/PostEditor";
// Mobile Components
import PostEditorMobile from "@/components/PostEditor/mobile/PostEditor";
import type { TPostAPI } from "@/components/PostEditor/types/postAPI";
// Types
import type { TThread } from "@/interfaces/Thread";
import type { User } from "@/interfaces/User";
// Modules
import { imageUpload } from "@/modules/imageUploadAPI";
// Utils
import useIsMobile from "@/utils/useIsMobile";
import { useUserAccount } from "@/utils/useUserAccount";

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

  // Only judge ownership once both the post and the login are known;
  // deciding earlier bounced the real owner whenever /login answered first.
  useEffect(() => {
    if (isLoading || !oldPostData) {
      return;
    }
    if (!isLogin || ownerOf(oldPostData) !== userData?._id) {
      route.push(`/post/${postID}`);
    }
  }, [oldPostData, userData, isLoading, isLogin, route, postID]);

  const baseline = oldPostData ? toForm(oldPostData) : null;
  const unchanged =
    baseline !== null &&
    baseline.content === currentPostData.content &&
    baseline.title === currentPostData.title &&
    baseline.sig === currentPostData.sig &&
    baseline.cover === currentPostData.cover &&
    baseline.hashtag?.toString() === currentPostData.hashtag?.toString();
  const editButtonDisable =
    !baseline ||
    saving ||
    unchanged ||
    !currentPostData.content ||
    !currentPostData.title ||
    !currentPostData.sig;

  function undo() {
    if (oldPostData) {
      setCurrentPostData(toForm(oldPostData));
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
    const res = await editPostAPI(currentPostData, postID, token ?? "");
    setSaving(false);
    if (res.ok) {
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

  if (
    isLoading ||
    !oldPostData ||
    !userData ||
    ownerOf(oldPostData) !== userData._id
  ) {
    return <div></div>;
  }

  return isMobile ? (
    <PostEditorMobile
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
    ></PostEditorMobile>
  ) : (
    <PostEditorDesktop
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
    />
  );
}

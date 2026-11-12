"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { DocPage } from "@/components/desktop/DocPage";
import { PageTitle } from "@/components/mobile/PageTitle";
import { DraftList } from "@/components/PostEditor/shared/DraftBar";
import useIsMobile from "@/utils/useIsMobile";
import { useUserAccount } from "@/utils/useUserAccount";

// 我的 → 草稿 (decision 7B, editor 3B): the cloud drafts, the same list
// the editor's 「草稿」 button shows. Resuming opens the editor (or the
// edit page for a draft of a published post).

export default function DraftsPage() {
  const isMobile = useIsMobile();
  const router = useRouter();
  const { isLogin, isLoading, userData, login } = useUserAccount();
  const userId = userData?._id ?? "";

  let body: ReactNode;
  if (isLoading) {
    body = (
      <div
        aria-hidden
        className="h-40 animate-pulse rounded-card border border-line bg-surface"
      />
    );
  } else if (!isLogin || !userId) {
    body = (
      <section className="flex flex-col items-center gap-3 rounded-card border border-line bg-surface px-6 py-10 text-center shadow-card">
        <p className="text-ink-700">登入後，寫到一半的貼文會存成雲端草稿。</p>
        <button
          type="button"
          onClick={() => login()}
          className="h-10 cursor-pointer rounded-control bg-brand-700 px-6 font-semibold text-sm text-white hover:bg-brand-800"
        >
          登入
        </button>
      </section>
    );
  } else {
    body = (
      <section className="rounded-card border border-line bg-surface p-4 shadow-card lg:p-5">
        <DraftList
          userId={userId}
          currentId={null}
          mobile={isMobile}
          onResume={(draft) =>
            router.push(
              draft.post
                ? `/post/${draft.post}/edit?draft=${draft._id}`
                : `/new?draft=${draft._id}`,
            )
          }
          onNew={() => router.push("/new")}
          onDeleted={() => {
            // The list updates its own cache.
          }}
        />
      </section>
    );
  }

  if (isMobile) {
    return (
      <div className="flex h-full flex-col gap-2 px-2 pt-[calc(4.5rem+env(safe-area-inset-top))] pb-[calc(4rem+env(safe-area-inset-bottom))]">
        <PageTitle title="草稿" />
        <div className="scrollbar-hide flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-4">
          {body}
        </div>
      </div>
    );
  }
  return (
    <DocPage title="草稿" description="寫到一半的貼文" width="narrow">
      {body}
    </DocPage>
  );
}

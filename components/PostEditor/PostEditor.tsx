"use client";

import {
  CloudUpload,
  Eye,
  PanelRightClose,
  PanelRightOpen,
  PenLine,
} from "lucide-react";
import dynamic from "next/dynamic";
import {
  type ChangeEvent,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { BottomSheet } from "@/components/mobile/BottomSheet";
import { storageGet, storageSet } from "@/utils/safeStorage";
import useIsMobile from "@/utils/useIsMobile";
import { isDefaultContent } from "./config/markdownGuide";
import type { EditorView } from "./desktop/Editor";
import { EditorSettings } from "./settings/EditorSettings";
import { EditorErrorBoundary } from "./shared/EditorErrorBoundary";
import { LoginBanner } from "./shared/LoginBanner";
import type { TPostAPI } from "./types/postAPI";

// The post editor (design v4 6B), for new posts and edits alike: one
// screen with a sticky bar (cloud-save status, 草稿, 捨棄, 設定, 發布),
// the writing area (title, toolbar, CodeMirror) with the live preview
// beside it, filling the window down to a 1.5rem margin and scrolling
// inside, and a right settings column that folds away (SIG, cover, tags,
// series, the card preview) and scrolls inside when it is taller. Under 1280px the preview is a 寫作 / 並排 /
// 預覽 switch; on phones 發布 opens the settings as a sheet, whose 發布
// publishes. Missing required fields show under the field when 發布 is
// pressed, never while typing. The page (app/new, the edit page) keeps
// the data, the drafts and the API calls.

const DesktopEditor = dynamic(() => import("./desktop/Editor"), {
  ssr: false,
});
const MobileEditor = dynamic(() => import("./mobile/Editor"), { ssr: false });

const VIEW_KEY = "mdsig-editor-view";
const SETTINGS_KEY = "mdsig-editor-settings";
const WIDE = "(min-width: 1280px)";

type FormChange = (e: {
  target: { name: string; value: string | string[] };
}) => void;

export type SeriesChoice = {
  value: string;
  onChange: (id: string) => void;
  /** Edit mode: the post, which may already be in a series. */
  postId?: string;
};

interface Props {
  data: TPostAPI;
  setPostData: Dispatch<SetStateAction<TPostAPI>>;
  token: string;
  handleFormEventFunction: FormChange;
  discardFunction: (e: React.MouseEvent<HTMLButtonElement>) => void;
  postFunction: () => unknown;
  postButtonDisable: boolean;
  handleFileChange?: (e: ChangeEvent<HTMLInputElement>) => unknown;
  isEdit?: boolean;
  /** Edit mode: the SIG the post is already in. */
  originalSig?: string;
  /** Notices above the editor (local draft offer, pending draft…). */
  topBar?: ReactNode;
  /** The cloud-draft status and 「草稿」 (DraftBar). */
  statusBar?: ReactNode;
  /** 加入系列 (signed in only). */
  series?: SeriesChoice;
}

export default function PostEditor({
  data,
  setPostData,
  token,
  handleFormEventFunction,
  discardFunction,
  postFunction,
  postButtonDisable,
  handleFileChange,
  isEdit = false,
  originalSig,
  topBar,
  statusBar,
  series,
}: Props) {
  const mobile = useIsMobile();
  const [view, setView] = useState<EditorView>("split");
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [errors, setErrors] = useState<{
    title?: string;
    sig?: string;
    content?: string;
  }>({});
  const titleRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const contentErrorId = useId();

  // Wide screens start side by side with the settings open; narrower ones
  // start on 寫作 with the settings folded. Choices are remembered.
  useEffect(() => {
    const wide = window.matchMedia(WIDE).matches;
    const savedView = storageGet(VIEW_KEY);
    setView(
      savedView === "write" || savedView === "split" || savedView === "preview"
        ? savedView
        : wide
          ? "split"
          : "write",
    );
    const savedSettings = storageGet(SETTINGS_KEY);
    setSettingsOpen(savedSettings ? savedSettings === "open" : wide);
  }, []);

  function changeView(next: EditorView) {
    setView(next);
    storageSet(VIEW_KEY, next);
  }

  function toggleSettings() {
    setSettingsOpen((open) => {
      storageSet(SETTINGS_KEY, open ? "closed" : "open");
      return !open;
    });
  }

  function onFieldChange(event: Parameters<FormChange>[0]) {
    const name = event.target.name as keyof typeof errors;
    if (errors[name]) {
      setErrors((current) => ({ ...current, [name]: undefined }));
    }
    handleFormEventFunction(event);
  }

  function setField(name: string, value: string | string[]) {
    onFieldChange({ target: { name, value } });
  }

  /** Checks the required fields; shows what is missing under each. */
  function validate() {
    const next = {
      title: data.title.trim() ? undefined : "請輸入標題",
      content: isDefaultContent(data.content) ? "請輸入內文" : undefined,
      sig: data.sig ? undefined : "請選擇要發布到哪個 SIG",
    };
    setErrors(next);
    if (next.title || next.content) {
      setSheetOpen(false);
      requestAnimationFrame(() => {
        if (next.title) {
          titleRef.current?.focus();
          titleRef.current?.scrollIntoView({ block: "center" });
        } else {
          document
            .getElementById(contentErrorId)
            ?.scrollIntoView({ block: "center" });
        }
      });
      return false;
    }
    if (next.sig) {
      if (mobile) {
        setSheetOpen(true);
      } else {
        setSettingsOpen(true);
      }
      requestAnimationFrame(() =>
        document
          .querySelector("[data-sig-picker]")
          ?.scrollIntoView({ block: "center" }),
      );
      return false;
    }
    return true;
  }

  function publish() {
    if (validate()) {
      setSheetOpen(false);
      void postFunction();
    }
  }

  const label = isEdit ? "更新" : "發布";
  const button =
    "inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-control px-3.5 font-semibold text-sm transition-colors disabled:cursor-not-allowed";
  const height = mobile ? "h-11" : "h-9";
  const primary = `${button} ${height} bg-brand-700 text-white hover:bg-brand-800 disabled:bg-ink-900/10 disabled:text-ink-400`;
  const secondary = `${button} ${height} border border-line-strong bg-surface text-ink-800 hover:bg-field`;

  const discardButton = (
    <button
      type="button"
      className={`${button} ${height} text-danger-700 hover:bg-danger-50`}
      onClick={discardFunction}
    >
      {isEdit ? "還原" : "捨棄"}
    </button>
  );

  const titleField = (
    <div className="flex shrink-0 flex-col gap-1">
      <input
        ref={titleRef}
        id={titleId}
        type="text"
        name="title"
        value={data.title}
        onChange={(event) => onFieldChange(event)}
        placeholder="標題"
        aria-label="標題"
        aria-invalid={Boolean(errors.title) || undefined}
        aria-describedby={errors.title ? `${titleId}-error` : undefined}
        className={`w-full rounded-control border bg-surface px-4 font-bold text-ink-900 placeholder:font-semibold placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-700/30 ${
          mobile ? "h-12 text-[18px]" : "h-14 text-xl"
        } ${errors.title ? "border-danger-700" : "border-line shadow-card"}`}
      />
      {errors.title && (
        <p
          id={`${titleId}-error`}
          role="alert"
          className="px-1 text-danger-700 text-sm"
        >
          {errors.title}
        </p>
      )}
    </div>
  );

  const editor = (
    <EditorErrorBoundary data={data} setPostData={setPostData}>
      {mobile ? (
        <MobileEditor
          data={data}
          setPostData={setPostData}
          token={token}
          preview={view === "preview"}
        />
      ) : (
        <DesktopEditor
          data={data}
          setPostData={setPostData}
          token={token}
          view={view}
          onViewChange={changeView}
        />
      )}
    </EditorErrorBoundary>
  );

  const contentError = errors.content && (
    <p
      id={contentErrorId}
      role="alert"
      className="shrink-0 px-1 text-danger-700 text-sm"
    >
      {errors.content}
    </p>
  );

  const settings = (
    <EditorSettings
      data={data}
      setField={setField}
      onFileChange={handleFileChange}
      originalSig={originalSig}
      sigError={errors.sig}
      series={series}
      mobile={mobile}
      actions={
        mobile ? (
          <div className="flex items-center justify-end gap-2">
            {discardButton}
            <button
              type="button"
              className={`${primary} flex-1`}
              onClick={publish}
              disabled={postButtonDisable}
            >
              <CloudUpload aria-hidden className="size-[18px]" />
              {label}
            </button>
          </div>
        ) : null
      }
    />
  );

  if (mobile) {
    return (
      <div
        className="flex h-dvh flex-col gap-2 overflow-hidden px-2 pt-[calc(4.5rem+env(safe-area-inset-top))] pb-[calc(4.5rem+env(safe-area-inset-bottom))]"
        data-post-editor
      >
        {!isEdit && <LoginBanner className="shrink-0" />}
        {topBar && (
          <div className="flex shrink-0 flex-col gap-2 empty:hidden">
            {topBar}
          </div>
        )}
        {statusBar && <div className="shrink-0">{statusBar}</div>}
        {titleField}
        <div className="flex min-h-0 flex-1 flex-col">{editor}</div>
        {contentError}
        <div className="flex shrink-0 items-center gap-2">
          <fieldset
            aria-label="檢視"
            className="flex rounded-control bg-ink-900/6 p-1"
          >
            {(
              [
                ["write", "寫作", PenLine],
                ["preview", "預覽", Eye],
              ] as const
            ).map(([value, text, Icon]) => {
              const on =
                value === "preview" ? view === "preview" : view !== "preview";
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={on}
                  onClick={() => changeView(value)}
                  className={`flex h-9 cursor-pointer items-center gap-1 rounded-[6px] px-3 font-semibold text-sm ${
                    on ? "bg-surface text-ink-900 shadow-card" : "text-ink-500"
                  }`}
                >
                  <Icon aria-hidden className="size-4" />
                  {text}
                </button>
              );
            })}
          </fieldset>
          <span className="flex-1" />
          <button
            type="button"
            className={primary}
            onClick={() => setSheetOpen(true)}
            aria-haspopup="dialog"
          >
            <CloudUpload aria-hidden className="size-[18px]" />
            {label}
          </button>
        </div>
        <BottomSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          title={`${label}設定`}
          snapPoints={["92%"]}
        >
          <div data-editor-sheet>{settings}</div>
        </BottomSheet>
      </div>
    );
  }

  return (
    <div
      className="mx-auto flex w-[min(100%-3rem,112rem)] flex-col gap-3"
      data-post-editor
    >
      {!isEdit && <LoginBanner className="shrink-0" />}
      {topBar && (
        <div className="flex shrink-0 flex-col gap-2 empty:hidden">
          {topBar}
        </div>
      )}
      <div
        className="sticky top-[calc(var(--shell-header-h,4rem)+var(--site-notices-h,0px))] z-30 flex h-12 shrink-0 items-center gap-2 rounded-card border border-line bg-surface/95 pr-1.5 pl-3 shadow-card backdrop-blur-md"
        data-editor-bar
      >
        <div className="min-w-0 flex-1">{statusBar}</div>
        {discardButton}
        <button
          type="button"
          className={secondary}
          onClick={toggleSettings}
          aria-expanded={settingsOpen}
          aria-controls="post-editor-settings"
        >
          {settingsOpen ? (
            <PanelRightClose aria-hidden className="size-4" />
          ) : (
            <PanelRightOpen aria-hidden className="size-4" />
          )}
          設定
        </button>
        <button
          type="button"
          className={`${primary} px-5`}
          onClick={publish}
          disabled={postButtonDisable}
        >
          <CloudUpload aria-hidden className="size-[18px]" />
          {label}
        </button>
      </div>
      <div
        className={`grid items-start gap-4 ${
          settingsOpen ? "grid-cols-[minmax(0,1fr)_24rem]" : "grid-cols-1"
        }`}
      >
        <section
          aria-label="寫作"
          className="flex h-[max(28rem,calc(100dvh-var(--shell-top,5.5rem)-5.25rem))] min-w-0 flex-col gap-3"
          data-editor-writing
        >
          {titleField}
          <div className="min-h-0 flex-1">{editor}</div>
          {contentError}
        </section>
        {settingsOpen && (
          <aside
            id="post-editor-settings"
            aria-label={`${label}設定`}
            className="custom-scrollbar sticky top-[calc(var(--shell-top,5.5rem)+3.75rem)] max-h-[max(28rem,calc(100dvh-var(--shell-top,5.5rem)-5.25rem))] self-start overflow-y-auto rounded-card border border-line bg-surface p-4 shadow-card"
          >
            {settings}
          </aside>
        )}
      </div>
    </div>
  );
}

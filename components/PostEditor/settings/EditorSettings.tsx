"use client";

import {
  type ChangeEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { PostCard } from "@/components/PostCard/PostCard";
import type { TThread } from "@/interfaces/Thread";
import { FALLBACK_DEFAULT_COVERS } from "@/modules/sigTheme/fallbackCovers";
import useSig from "@/utils/useSig";
import { useUserAccount } from "@/utils/useUserAccount";
import { isDefaultContent } from "../config/markdownGuide";
import type { SeriesChoice } from "../PostEditor";
import type { TPostAPI } from "../types/postAPI";
import { CoverField } from "./CoverField";
import { SeriesPicker } from "./SeriesPicker";
import { SigPicker } from "./SigPicker";
import { TagInput } from "./TagInput";

// The editor's settings column (v4 6B with 7B–10B), top to bottom:
// 發布到, 封面, 標籤, 加入系列, the card as it will look in the feeds, then
// 捨棄 and 發布. On phones the same column is the 發布 sheet.

export function EditorSettings({
  data,
  setField,
  onFileChange,
  originalSig,
  sigError,
  series,
  mobile,
  actions,
}: {
  data: TPostAPI;
  setField: (name: string, value: string | string[]) => void;
  onFileChange?: (e: ChangeEvent<HTMLInputElement>) => unknown;
  originalSig?: string;
  sigError?: string;
  series?: SeriesChoice;
  mobile: boolean;
  actions: ReactNode;
}) {
  const { userData } = useUserAccount();
  const { data: sig } = useSig(data.sig || undefined);
  const defaultCover =
    (data.sig && (sig?.defaultCover || FALLBACK_DEFAULT_COVERS[data.sig])) ||
    "";

  // The card as the feeds will show it, from what is written so far.
  const preview: TThread = {
    _id: "preview",
    title: data.title || "（無標題）",
    content: isDefaultContent(data.content) ? "" : data.content,
    cover: data.cover || defaultCover,
    sig: (data.sig
      ? {
          _id: data.sig,
          name: sig?.name ?? "",
          color: sig?.color,
          customId: sig?.customId,
        }
      : null) as unknown as string,
    user: {
      _id: userData?._id ?? "",
      name: userData?.name || "你",
      customId: userData?.customId,
    } as unknown as string,
    hashtag: data.hashtag ?? [],
    likes: 0,
    comments: 0,
    views: 0,
    createdAt: new Date().toISOString(),
  };

  return (
    <div className="flex flex-col gap-6" data-editor-settings>
      <SigPicker
        value={data.sig}
        onChange={(id) => setField("sig", id)}
        keepSigId={originalSig}
        error={sigError}
        mobile={mobile}
      />
      <CoverField
        cover={data.cover}
        sigId={data.sig}
        onFile={onFileChange}
        onRemove={() => setField("cover", "")}
        mobile={mobile}
      />
      <TagInput
        tags={Array.isArray(data.hashtag) ? data.hashtag : []}
        onChange={(tags) => setField("hashtag", tags)}
        sigId={data.sig}
        mobile={mobile}
      />
      {series && (
        <SeriesPicker
          value={series.value}
          onChange={series.onChange}
          postId={series.postId}
          title={data.title}
          mobile={mobile}
        />
      )}
      <section
        aria-labelledby="card-preview-title"
        className="flex flex-col gap-2"
      >
        <h2
          id="card-preview-title"
          className="font-semibold text-ink-900 text-sm"
        >
          卡片預覽
        </h2>
        <ScaledCard post={preview} />
      </section>
      {actions}
    </div>
  );
}

/** The feed's card width: the preview is drawn at it, then scaled down. */
const FEED_CARD_WIDTH = 768;

/**
 * The card exactly as the feed shows it, drawn at the feed's width and
 * scaled to the column (a picture of it: not a link, not focusable).
 */
function ScaledCard({ post }: { post: TThread }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ scale: 1, height: 0 });
  useEffect(() => {
    const box = boxRef.current;
    const card = cardRef.current;
    if (!box || !card) {
      return;
    }
    const measure = () => {
      const scale = Math.min(1, box.clientWidth / FEED_CARD_WIDTH);
      setSize({ scale, height: card.offsetHeight * scale });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    observer.observe(card);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      ref={boxRef}
      className="relative w-full overflow-hidden"
      style={{ height: size.height || undefined }}
      data-card-preview
    >
      <div
        ref={cardRef}
        inert
        className="absolute top-0 left-0 origin-top-left select-none"
        style={{
          width: FEED_CARD_WIDTH,
          transform: `scale(${size.scale})`,
        }}
      >
        <PostCard post={post} />
      </div>
    </div>
  );
}

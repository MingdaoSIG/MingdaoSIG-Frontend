import { CloudUpload, Trash2 } from "lucide-react";

interface Props {
  discardFunction: (e: React.MouseEvent<HTMLButtonElement>) => void;
  postFunction: () => void;
  postButtonDisable: boolean;
  isEdit?: boolean;
}

export default function Buttons({
  discardFunction,
  postFunction,
  postButtonDisable,
  isEdit,
}: Props) {
  return (
    <div className="mx-auto grid h-auto w-full grid-cols-2 gap-3">
      <button
        type="button"
        className="flex h-11 flex-row items-center justify-center gap-1.5 rounded-control border border-line-strong bg-surface font-bold text-base text-danger-700 active:bg-[#fdf1f0]"
        onClick={(e) => discardFunction(e)}
      >
        <Trash2 size={19} aria-hidden />
        {isEdit ? "UNDO" : "DISCARD"}
      </button>
      <button
        type="button"
        className="flex h-11 flex-row items-center justify-center gap-1.5 rounded-control bg-brand-700 font-bold text-base text-white active:bg-brand-800 disabled:cursor-not-allowed disabled:bg-ink-900/10 disabled:text-ink-400"
        onClick={async () => await postFunction()}
        disabled={postButtonDisable}
      >
        <CloudUpload size={21} aria-hidden />
        POST
      </button>
    </div>
  );
}

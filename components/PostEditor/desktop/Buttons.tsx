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
    <div className="mt-4 grid h-12 grid-cols-2 gap-4">
      <button
        type="button"
        className="flex cursor-pointer flex-row items-center justify-center gap-2 rounded-control border border-line-strong bg-surface font-bold text-base text-danger-700 shadow-card transition-colors hover:bg-[#fdf1f0]"
        onClick={(e) => discardFunction(e)}
      >
        <Trash2 size={20} aria-hidden />
        {isEdit ? "UNDO" : "DISCARD"}
      </button>

      <button
        type="button"
        className={`flex flex-row items-center justify-center gap-2 rounded-control font-bold text-base transition-colors ${
          postButtonDisable
            ? "cursor-not-allowed bg-ink-900/10 text-ink-400"
            : "cursor-pointer bg-brand-700 text-white shadow-[0_6px_16px_-10px_rgba(11,90,131,0.9)] hover:bg-brand-800"
        }`}
        onClick={async () => await postFunction()}
        disabled={postButtonDisable}
      >
        <CloudUpload size={22} aria-hidden />
        POST
      </button>
    </div>
  );
}

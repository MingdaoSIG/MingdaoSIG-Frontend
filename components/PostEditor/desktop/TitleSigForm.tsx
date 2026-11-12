import { useSigOptions } from "../shared/useSigOptions";
import type { TPostAPI } from "../types/postAPI";

interface Props {
  data: TPostAPI;
  handleFormEventFunction: (e: {
    target: { name: string; value: string | string[] };
  }) => void;
  /** The SIG an edited post is already in (always selectable). */
  originalSig?: string;
}

export default function TitleSigForm({
  data,
  handleFormEventFunction,
  originalSig,
}: Props) {
  const sigOptions = useSigOptions(originalSig);

  return (
    <div className="mb-3 flex h-11 w-full items-center overflow-hidden rounded-control border border-line bg-surface shadow-card">
      <input
        type="text"
        name="title"
        className="h-full flex-1 border-line border-r bg-surface pr-3 pl-4 text-ink-900 placeholder:text-ink-400 focus:outline-none"
        value={data?.title}
        placeholder="請輸入標題..."
        aria-label="標題"
        onChange={(e) => handleFormEventFunction(e)}
      />
      <div className="h-full w-[12rem] items-center justify-center bg-surface text-left">
        <select
          name="sig"
          value={data?.sig}
          aria-label="SIG"
          className="h-full w-full px-2 text-left text-ink-800 focus:outline-none"
          onChange={(e) => {
            handleFormEventFunction(e);
          }}
        >
          <option value="">請選擇 SIG</option>
          {sigOptions.map((sig) => (
            <option value={sig.id} key={sig.id} disabled={!sig.allowed}>
              {sig.allowed ? sig.name : `${sig.name}（未加入）`}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

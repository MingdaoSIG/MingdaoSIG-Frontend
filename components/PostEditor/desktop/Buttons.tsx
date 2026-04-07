import Image from "next/image";

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
        className="flex flex-row items-center justify-center gap-1 rounded-full bg-[#dc0032] text-center font-bold text-lg text-white transition-colors hover:bg-[#b8002a]"
        onClick={(e) => discardFunction(e)}
      >
        <Image src="/icons/trash.svg" width={22} height={22} alt="trash" />
        {isEdit ? "UNDO" : "DISCARD"}
      </button>

      <button
        type="button"
        className={`flex flex-row items-center justify-center gap-1 rounded-full text-center font-bold text-lg transition-colors ${
          postButtonDisable
            ? "cursor-not-allowed bg-gray-300 text-gray-500"
            : "bg-white text-[#5fcdf5] hover:bg-gray-50"
        }
        `}
        onClick={async () => await postFunction()}
        disabled={postButtonDisable}
      >
        <Image
          src="/icons/cloud-upload.svg"
          width={28}
          height={28}
          alt="cloud-upload"
        />
        POST
      </button>
    </div>
  );
}

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
    <div className="mx-auto grid h-auto w-full grid-cols-2 gap-2 rounded-[3rem]">
      <button
        type="button"
        className="flex flex-row items-center justify-center gap-1 rounded-lg bg-[#dc0032] py-1.5 text-center font-bold text-base text-white"
        onClick={(e) => discardFunction(e)}
      >
        {isEdit ? (
          <>
            <Image src="/icons/trash.svg" width={22} height={22} alt="trash" />
            UNDO
          </>
        ) : (
          <>
            <Image src="/icons/trash.svg" width={22} height={22} alt="trash" />
            DISCARD
          </>
        )}
      </button>
      <button
        type="button"
        className="flex flex-row items-center justify-center gap-1 rounded-lg border border-[#5fcdf5] bg-white py-1.5 text-center font-bold text-[#5fcdf5] text-base disabled:cursor-not-allowed disabled:opacity-50"
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

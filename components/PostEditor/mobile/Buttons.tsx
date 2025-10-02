import Image from "next/image";

interface Props {
  discardFunction: Function;
  postFunction: Function;
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
    <div className="h-auto w-full rounded-[3rem] mx-auto grid grid-cols-2 gap-2">
      <button
        className="flex flex-row justify-center items-center text-center rounded-lg gap-1 bg-[#dc0032] text-white text-base font-bold py-1.5"
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
        className="flex flex-row justify-center items-center text-center rounded-lg gap-1 bg-white text-[#5fcdf5] text-base font-bold disabled:opacity-50 disabled:cursor-not-allowed border border-[#5fcdf5] py-1.5"
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
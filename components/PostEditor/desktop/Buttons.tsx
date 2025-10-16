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
    <div className="h-12 grid grid-cols-2 gap-4 mt-4">
      <button
        className="flex flex-row justify-center items-center text-center rounded-full gap-1 bg-[#dc0032] text-white text-lg font-bold hover:bg-[#b8002a] transition-colors"
        onClick={(e) => discardFunction(e)}
      >
        <Image src="/icons/trash.svg" width={22} height={22} alt="trash" />
        {isEdit ? "UNDO" : "DISCARD"}
      </button>

      <button
        className={`
          flex flex-row justify-center items-center text-center rounded-full gap-1 text-lg font-bold
          transition-colors
          ${postButtonDisable
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
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

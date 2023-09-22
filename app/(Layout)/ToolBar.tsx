import Image from "next/image";

const ToolBar = () => {
  return (
    <div className="w-full absolute bottom-[64px]">
      <div className="h-[90px] w-[484px] bg-white bg-opacity-50 mx-auto rounded-full border-white border-opacity-60 border">
        <div className="h-full w-[350px] mx-auto flex">
          <div className="flex-1 my-auto">
            <Image
              src={"/icons/bx-home-circle.svg"}
              height={32}
              width={32}
              alt="bookmark"
              className="cursor-pointer mx-auto"
            ></Image>
          </div>
          <div className="flex-1 my-auto">
            <Image
              src={"/icons/bx-user.svg"}
              height={32}
              width={32}
              alt="bookmark"
              className="cursor-pointer mx-auto"
            ></Image>
          </div>
          <div className="flex-1 my-auto">
            <Image
              src={"/icons/bxs-bell-ring.svg"}
              height={32}
              width={32}
              alt="bookmark"
              className="cursor-pointer mx-auto"
            ></Image>
          </div>
          <div className="flex-1 my-auto">
            <Image
              src={"/icons/bx-menu-alt-right.svg"}
              height={32}
              width={32}
              alt="bookmark"
              className="cursor-pointer mx-auto"
            ></Image>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToolBar;

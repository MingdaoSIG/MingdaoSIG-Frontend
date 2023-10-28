import Image from "next/image";

// Styles
import styles from "./Info.module.scss";

// Components
import CustomPopover from "@/components/Popover";

// Interfaces
import { User } from "@/interfaces/User";
import { Sig } from "@/interfaces/Sig";

const badge = [
  <div
    className="bg-[rgb(100,100,100)] bg-opacity-0 ml-5 px-3 py-auto h-[36px] rounded-md my-auto grid gap-[0.2rem] absolute top-[calc(33.333333%_+_60px)] grid-cols-2 left-[6rem]"
    key={"badge"}
  >
    <div className="my-auto relative select-none" key={"developer"}>
      <div className="h-[24px] w-[24px] group cursor-pointer">
        <span className="group-hover:opacity-100 transition-opacity bg-[rgb(0,190,245)] px-1 text-sm text-white rounded-md absolute left-1/2 -translate-x-1/2 -translate-y-7 opacity-0 mx-auto whitespace-nowrap inline-block hover:hidden hover:cursor-default">
          Developer
        </span>
        <Image
          src={"/badges/developer.svg"}
          height={24}
          width={24}
          alt="developer"
          className="developer my-auto"
        />
      </div>
    </div>
    <div className="my-auto relative select-none" key={"developer"}>
      <div className="h-[24px] w-[24px] group cursor-pointer">
        <span className="group-hover:opacity-100 transition-opacity bg-[rgb(0,190,245)] px-1 text-sm text-white rounded-md absolute left-1/2 -translate-x-1/2 -translate-y-7 opacity-0 mx-auto whitespace-nowrap inline-block hover:hidden hover:cursor-default">
          10/21 Event Participant
        </span>
        <Image
          src={"/badges/1021user.svg"}
          height={24}
          width={24}
          alt="developer"
          className="developer my-auto"
        />
      </div>
    </div>
  </div>,
];

export default function Info({
  user,
  isLoading,
}: {
  user: User | Sig | null;
  isLoading: boolean;
}) {
  return (
    <div className={styles.info}>
      <div
        className={styles.banner}
        style={{ backgroundImage: "url(/images/banner.svg)" }}
      >
        <div className={styles.avatarWrapper}>
          <Image
            src={
              user
                ? user?.avatar
                : "https://sig-api.lazco.dev/image/653299930b891d1f6b5b4458"
            }
            width={100}
            height={100}
            alt="Avatar"
            className={styles.avatar}
          />
          <div className={styles.badgeWrapper}>
            <CustomPopover popoverContent="SIG Developer">
              <Image
                src={"/badges/developer.svg"}
                height={24}
                width={24}
                alt="developer"
                className={styles.badge}
              />
            </CustomPopover>
            <CustomPopover popoverContent="10/21 Event Participant">
              <Image
                src={"/badges/1021user.svg"}
                height={24}
                width={24}
                alt="1021user"
                className={styles.badge}
              />
            </CustomPopover>
          </div>
        </div>
        {/* {(user?._id === "65179f64cf392fefee97191f" || // Haco
            user?._id === "652f28f5577c25ec87b5050e" || // Meru
            user?._id === "6517b7b22ee473ac669f205b" || // OnCloud
            user?._id === "6525225146132ec53332a820") && // Lazp
            badge[0]} */}
      </div>
      <div className={styles.content}>
        <div className={styles.name}>
          {user?.name}
          <p>
            {user?.customId.length !== 0 && "@"}
            {user?.customId}
          </p>
        </div>
        <div className={styles.description}>
          {user?.description?.split("\n").map((line) => (
            <>
              <p key={line}>{line}</p>
            </>
          ))}
        </div>
      </div>
    </div>
  );
}

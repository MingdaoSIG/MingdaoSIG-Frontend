import Image from "next/image";

// Styles
import styles from "./Info.module.scss";

// Components
import Popover from "@/components/Popover";

// Interfaces
import { User } from "@/interfaces/User";
import { Sig } from "@/interfaces/Sig";

export default function Info({
  user: accountData,
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
              accountData?.avatar ?? "https://sig-api.lazco.dev/image/653299930b891d1f6b5b4458"
            }
            width={100}
            height={100}
            alt="Avatar"
            className={styles.avatar}
          />
          {accountData?.badge ? (
            <BadgeList userData={accountData} />
          ) : (
            <></>
          )}
        </div>
        {/* {(user?._id === "65179f64cf392fefee97191f" || // Haco
            user?._id === "652f28f5577c25ec87b5050e" || // Meru
            user?._id === "6517b7b22ee473ac669f205b" || // OnCloud
            user?._id === "6525225146132ec53332a820") && // Lazp
            badge[0]} */}
      </div>
      <div className={styles.content}>
        <div className={styles.name}>
          {accountData?.name}
          <p>
            {accountData && "@"}
            {accountData?.customId}
          </p>
        </div>
        <div className={styles.description}>
          {accountData?.description?.split("\n").map((line) => (
            <>
              <p key={line}>{line}</p>
            </>
          ))}
        </div>
      </div>
    </div>
  );
}

const badgeList = {
  "developer": (
    <Popover popoverContent="SIG Developer">
      <Image
        src={"/badges/developer.svg"}
        height={24}
        width={24}
        alt="developer"
        className={styles.badge}
      />
    </Popover>
  ),
  "10.21_user": (
    <Popover popoverContent="10/21 Event Participant">
      <Image
        src={"/badges/10.21_user.svg"}
        height={24}
        width={24}
        alt="1021user"
        className={styles.badge}
      />
    </Popover>
  )
};
function BadgeList({ userData }: { userData: User | null }) {
  const chosenBadge = userData?.badge;

  if (userData && chosenBadge && chosenBadge.length > 0) {
    return (
      <div className={styles.badgeWrapper}>
        {chosenBadge.map((badge) => badgeList[badge])}
      </div>
    );
  } else {
    return <></>;
  }
}
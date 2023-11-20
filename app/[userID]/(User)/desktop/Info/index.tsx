import Image from "next/image";
import { Tooltip } from "react-tooltip";
import { Fragment, useState } from "react";
import Linkify from "react-linkify";
import Swal from "sweetalert2";

// Styles
import styles from "./Info.module.scss";

// Interfaces
import { User } from "@/interfaces/User";
import { Sig } from "@/interfaces/Sig";

// Hooks
import { useUserAccount } from "@/utils/useUserAccount";

export default function Info({
  user: accountData,
  isLoading,
}: {
  user: User | Sig | null;
  isLoading: boolean;
}) {

  const { userData } = useUserAccount();
  const [isInput, setIsInput] = useState(false);

  function JumpOut(url: any) {
    Swal.fire({
      title: "<strong>HOLD UP</strong>",
      html: "<p>This link will take you to <br/><strong>" + url + "</strong><br/>Are you sure you want to go there?</p>",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yep!",
      cancelButtonText: "Cancel",
    }).then((res) => {
      if (res.isConfirmed) {
        window.open(url, "_blank");
      }
    });
  }

  function EditDescription(e: any) {
    setIsInput(!isInput);
  }

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
      </div>
      <div className={styles.contentWrapper}>
        <div className={styles.content}>
          <div className={styles.name}>
            <h1>
              {accountData?.name}
            </h1>
            <p>
              {accountData && "@"}
              {accountData?.customId}
            </p>
          </div>
          <hr className={styles.contentHR} />
          <div className={styles.descriptionTitleWrapper}>
            <h1 className={styles.descriptionTitle}>ABOUT ME</h1>
            {
              userData &&
              <button className={styles.descriptionEditButton} onClick={EditDescription}>
                <Image src={"/icons/edit.svg"} width={"20"} height={20} alt={"Edit"} />
              </button>
            }
          </div>
          {
            (isInput) ?
              (
                <textarea className={styles.description}>
                  {accountData?.description}
                </textarea>
              )
              :
              (
                <div className={styles.description}>
                  <Linkify componentDecorator={(decoratedHref, decoratedText, key) => (
                    <button key={key} onClick={() => {
                      JumpOut(decoratedHref);
                    }}>
                      {decoratedText}
                    </button>
                  )}>
                    {accountData?.description?.split("\n").map((line, index) => (
                      <p key={index}>{line}</p>
                    ))}
                  </Linkify>
                </div>
              )
          }
        </div>
      </div>
    </div >
  );
}

const badgeList = {
  "developer": {
    name: "developer",
    icon: "/badges/developer.svg",
    content: "Developer"
  },
  "10.21_user": {
    name: "10.21_user",
    icon: "/badges/10.21_user.svg",
    content: "10/21 Event Participant"
  }
};
function BadgeList({ userData }: { userData: User | null }) {
  const chosenBadge = userData?.badge;

  if (userData && chosenBadge && chosenBadge.length > 0) {
    return (
      <div className={styles.badgeWrapper}>
        {chosenBadge.map((badge) => (
          <Fragment key={badge}>
            <Image
              src={badgeList[badge].icon}
              height={24}
              width={24}
              alt={badgeList[badge].name}
              className={styles.badge}
              data-tooltip-id={badgeList[badge].name}
              data-tooltip-content={badgeList[badge].content}
              data-tooltip-place="top"
            />
            <Tooltip
              id={badgeList[badge].name}
              style={{
                padding: "0.2rem 0.4rem",
                backgroundColor: "rgb(50, 50, 50)"
              }}
            />
          </Fragment>
        ))}
      </div>
    );
  } else {
    return <></>;
  }
}
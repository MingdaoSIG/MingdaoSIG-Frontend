import Image from "next/image";
import { type Dispatch, Fragment, type SetStateAction } from "react";
import { Tooltip } from "react-tooltip";
// Config
import { badgeList } from "@/app/[userID]/(User)/config/badge";
import type { Sig } from "@/interfaces/Sig";
// Interfaces
import type { User } from "@/interfaces/User";
import { Description } from "../../components/Description";
import { useJoinSig } from "../../useJoinSig";
// Styles
import styles from "./Info.module.scss";

export default function Info({
  user: accountData,
  isLoading,
  dataType,
  setInfo: _setInfo,
}: {
  user: User | Sig | null;
  isLoading: boolean;
  dataType: string | null;
  setInfo: Dispatch<SetStateAction<User | Sig | null>>;
}) {
  const isSig = dataType === "sig";
  const joinSig = useJoinSig(accountData, isSig);

  return (
    <div className={styles.info}>
      <div className={styles.contentWrapper}>
        <div className={styles.content}>
          <div className={styles.nameWrapper}>
            <Image
              src={
                accountData?.avatar ??
                process.env.NEXT_PUBLIC_API_URL +
                  "/image/653299930b891d1f6b5b4458"
              }
              width={40}
              height={40}
              alt=""
              className={styles.avatar}
            />
            <div className={styles.name}>
              <h1>{accountData?.name}</h1>
              <p>
                {accountData && "@"}
                {accountData?.customId}
              </p>
            </div>
            <div className={styles.space}></div>
            {isSig && accountData?._id !== "652d60b842cdf6a660c2b778" && (
              // Not on the announcement SIG
              <button
                type="button"
                className={styles.joinBtn}
                onClick={joinSig.join}
                disabled={joinSig.disabled || isLoading}
              >
                {joinSig.label}
              </button>
            )}
            {accountData?.badge ? <BadgeList userData={accountData} /> : null}
          </div>
          {isSig && joinSig.notice && (
            <p className={styles.joinNotice}>{joinSig.notice}</p>
          )}
          <hr className={styles.contentHR} />
          {accountData && (
            <Description
              heading={
                <h2 className={styles.descriptionTitle}>
                  {isSig ? "SIG 簡介" : "關於我"}
                </h2>
              }
              text={accountData.description}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function BadgeList({ userData }: { userData: User | null }) {
  const chosenBadge = userData?.badge;

  if (userData && chosenBadge && chosenBadge.length > 0) {
    return (
      <div className={styles.badgeWrapper}>
        {chosenBadge.sort().map((badge) => {
          if (badgeList[badge] === undefined) {
            return <Fragment key={badge} />;
          }
          return (
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
                  backgroundColor: "rgb(50, 50, 50)",
                }}
              />
            </Fragment>
          );
        })}
      </div>
    );
  }
  return null;
}

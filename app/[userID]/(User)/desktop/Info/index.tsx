import { Pencil } from "lucide-react";
import Image from "next/image";
import { type Dispatch, Fragment, type SetStateAction, useState } from "react";
import { Tooltip } from "react-tooltip";
import Swal from "sweetalert2";
// APIs
import { postUser } from "@/app/[userID]/(User)/apis/postUserAPI";
// Config
import { badgeList } from "@/app/[userID]/(User)/config/badge";
import { NotificationSettingsEntry } from "@/components/Notifications/NotificationSettings";
import { PortfolioEntry } from "@/components/Portfolio/PortfolioEntry";
import type { Sig } from "@/interfaces/Sig";
// Interfaces
import type { User } from "@/interfaces/User";
import { DEFAULT_AVATAR_URL, imageUrl } from "@/modules/imageUrl";
// Hooks
import { useUserAccount } from "@/utils/useUserAccount";
import { Description } from "../../components/Description";
import { EditSigDialog } from "../../components/EditSigDialog";
import { useJoinSig } from "../../useJoinSig";
import { useLeaveSig } from "../../useLeaveSig";
import { useSigManager } from "../../useSigManager";
// Styles
import styles from "./Info.module.scss";

export default function Info({
  user: accountData,
  isLoading,
  dataType,
  setInfo,
}: {
  user: User | Sig | null;
  isLoading: boolean;
  dataType: string | null;
  setInfo: Dispatch<SetStateAction<User | Sig | null>>;
}) {
  const { userData, token, updateUser } = useUserAccount();
  const [isInput, setIsInput] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [newDescription, setNewDescription] = useState("");
  const [editingSig, setEditingSig] = useState(false);
  const isSig = dataType === "sig";
  const isOwnProfile =
    !isSig &&
    Boolean(userData?.customId) &&
    userData?.customId === accountData?.customId;
  const joinSig = useJoinSig(accountData, isSig);
  const manager = useSigManager(accountData, isSig);
  const { leave } = useLeaveSig({
    sig: isSig ? (accountData as Sig | null) : null,
    isLeader: manager.isLeader,
    isModerator: manager.isModerator,
    onLeft: joinSig.markLeft,
    notify: notice,
  });

  function EditDescriptionButtonHandle() {
    if (isInput && isEdit) {
      Swal.fire({
        title: "要儲存新的自我介紹嗎？",
        icon: "question",
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: "儲存",
        denyButtonText: "放棄修改",
        cancelButtonText: "繼續編輯",
        confirmButtonColor: "#0b5a83",
        denyButtonColor: "#586676",
      }).then(async (res) => {
        if (res.isConfirmed) {
          const response = await postUser(
            { description: newDescription },
            token ?? "",
          );
          if (!response.ok) {
            Swal.fire("儲存失敗", response.message, "error");
          } else {
            setInfo((prev) =>
              prev ? { ...prev, description: newDescription } : prev,
            );
            updateUser({ description: newDescription });
            Swal.fire("已儲存", "自我介紹已更新", "success");
            setIsInput(false);
            setIsEdit(false);
          }
        } else if (res.isDenied) {
          setNewDescription("");
          setIsInput(false);
          setIsEdit(false);
        }
      });
    } else {
      setIsInput(!isInput);
    }
  }

  function OnEditDescription(e: React.ChangeEvent<HTMLTextAreaElement>) {
    if (e.target.value !== userData?.description) {
      setIsEdit(true);
      setNewDescription(e.target.value);
    } else {
      setIsEdit(false);
    }
  }

  const heading = (
    <>
      <h2 className={styles.descriptionTitle}>
        {isSig ? "SIG 簡介" : "關於我"}
      </h2>
      {isOwnProfile && (
        <button
          type="button"
          className={styles.descriptionEditButton}
          onClick={EditDescriptionButtonHandle}
          aria-label={isInput ? "完成編輯" : "編輯自我介紹"}
        >
          <Image src={"/icons/edit.svg"} width={20} height={20} alt="" />
        </button>
      )}
    </>
  );

  return (
    <div className={styles.info}>
      <div
        className={styles.banner}
        style={{ backgroundImage: "url(/images/banner.svg)" }}
      >
        <div className={styles.avatarWrapper}>
          <Image
            src={imageUrl(accountData?.avatar) ?? DEFAULT_AVATAR_URL}
            width={100}
            height={100}
            alt=""
            className={styles.avatar}
          />
          {accountData?.badge ? <BadgeList userData={accountData} /> : null}
        </div>
        {manager.canManage && (
          <button
            type="button"
            className="absolute top-3 right-3 inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-control border border-line bg-surface/95 px-3 font-semibold text-ink-800 text-sm shadow-card transition-colors hover:bg-field"
            onClick={() => setEditingSig(true)}
          >
            <Pencil size={15} aria-hidden />
            編輯 SIG
          </button>
        )}
      </div>
      <div className={styles.contentWrapper}>
        <div className={styles.content}>
          <div className={styles.nameWrapper}>
            <div className={styles.name}>
              <h1>{accountData?.name}</h1>
              <p>
                {accountData && "@"}
                {accountData?.customId}
              </p>
            </div>
            <div className={styles.space}></div>
            {isSig &&
              accountData?._id !== "652d60b842cdf6a660c2b778" &&
              // Not on the announcement SIG
              (joinSig.isMember ? (
                <button
                  type="button"
                  className={styles.leaveBtn}
                  onClick={leave}
                  disabled={isLoading}
                >
                  退出 SIG
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.joinBtn}
                  onClick={joinSig.join}
                  disabled={joinSig.disabled || isLoading}
                >
                  {joinSig.label}
                </button>
              ))}
          </div>
          {isSig && (joinSig.notice || joinSig.isMember) && (
            <p className={styles.joinNotice}>
              {joinSig.isMember ? "你是這個 SIG 的成員" : joinSig.notice}
            </p>
          )}
          <hr className={styles.contentHR} />
          {isInput ? (
            <>
              <div className={styles.descriptionTitleWrapper}>{heading}</div>
              <textarea
                className={styles.description}
                onChange={OnEditDescription}
                defaultValue={accountData?.description}
                aria-label="自我介紹"
              />
            </>
          ) : (
            accountData && (
              <Description
                heading={heading}
                text={accountData.description}
                fill
              />
            )
          )}
          {isOwnProfile && (
            <>
              <hr className={styles.contentHR} />
              <NotificationSettingsEntry />
              <hr className={styles.contentHR} />
              <PortfolioEntry />
            </>
          )}
        </div>
      </div>
      {isSig && accountData && manager.canManage && (
        <EditSigDialog
          sig={accountData as Sig}
          open={editingSig}
          onClose={() => setEditingSig(false)}
          onSaved={(saved) => {
            setInfo(saved);
            notice("success", "SIG 資料已更新");
          }}
        />
      )}
    </div>
  );
}

/** Small toast at the top for results that need no answer. */
function notice(icon: "success" | "error", title: string) {
  void Swal.fire({
    toast: true,
    position: "top",
    icon,
    title,
    showConfirmButton: false,
    timer: icon === "error" ? 4000 : 2500,
    timerProgressBar: true,
  });
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

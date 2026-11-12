import { Pencil } from "lucide-react";
import Image from "next/image";
import {
  type Dispatch,
  Fragment,
  type SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import { Tooltip } from "react-tooltip";
// Config
import { badgeList } from "@/app/[userID]/(User)/config/badge";
import { toast } from "@/components/mobile/Toast";
import { NotificationSettingsEntry } from "@/components/Notifications/NotificationSettings";
import { PortfolioEntry } from "@/components/Portfolio/PortfolioEntry";
import type { Sig } from "@/interfaces/Sig";
// Interfaces
import type { User } from "@/interfaces/User";
import { DEFAULT_AVATAR_URL, imageUrl } from "@/modules/imageUrl";
import { useUserAccount } from "@/utils/useUserAccount";
import { postUser } from "../../apis/postUserAPI";
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
  const { userData } = useUserAccount();
  const [editingSig, setEditingSig] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
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
    notify: (icon, message) => toast[icon](message),
  });

  const headingTitle = (
    <h2 className={styles.descriptionTitle}>{isSig ? "SIG 簡介" : "關於我"}</h2>
  );
  const heading = (
    <>
      {headingTitle}
      {isOwnProfile && !editingBio && (
        <button
          type="button"
          className="-my-2 ml-auto flex min-h-10 cursor-pointer items-center gap-1 px-1 font-semibold text-[13px] text-brand-700"
          onClick={() => setEditingBio(true)}
        >
          <Pencil size={14} aria-hidden />
          編輯
        </button>
      )}
      {manager.canManage && (
        <button
          type="button"
          className="-my-2 ml-auto flex min-h-10 cursor-pointer items-center gap-1 px-1 font-semibold text-[13px] text-brand-700"
          onClick={() => setEditingSig(true)}
        >
          <Pencil size={14} aria-hidden />
          編輯 SIG
        </button>
      )}
    </>
  );

  return (
    <div className={styles.info}>
      <div className={styles.contentWrapper}>
        <div className={styles.content}>
          <div className={styles.nameWrapper}>
            <Image
              src={imageUrl(accountData?.avatar) ?? DEFAULT_AVATAR_URL}
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
            {accountData?.badge ? <BadgeList userData={accountData} /> : null}
          </div>
          {isSig && (joinSig.notice || joinSig.isMember) && (
            <p className={styles.joinNotice}>
              {joinSig.isMember ? "你是這個 SIG 的成員" : joinSig.notice}
            </p>
          )}
          <hr className={styles.contentHR} />
          {accountData &&
            (editingBio ? (
              <BioEditor
                heading={headingTitle}
                initial={accountData.description ?? ""}
                onCancel={() => setEditingBio(false)}
                onSaved={(description) => {
                  setInfo((prev) => (prev ? { ...prev, description } : prev));
                  setEditingBio(false);
                }}
              />
            ) : (
              <Description heading={heading} text={accountData.description} />
            ))}
          {isOwnProfile && (
            <>
              <hr className={styles.contentHR} />
              <NotificationSettingsEntry mobile />
              <hr className={styles.contentHR} />
              <PortfolioEntry mobile />
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
            toast.success("SIG 資料已更新");
          }}
        />
      )}
    </div>
  );
}

/** The backend limit for a profile description. */
const BIO_MAX = 250;

/** Editing your own 「關於我」 on a phone (desktop edits in place too). */
function BioEditor({
  heading,
  initial,
  onCancel,
  onSaved,
}: {
  heading: React.ReactNode;
  initial: string;
  onCancel: () => void;
  onSaved: (description: string) => void;
}) {
  const { token, updateUser } = useUserAccount();
  const [text, setText] = useState(initial);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);
  const tooLong = text.length > BIO_MAX;

  useEffect(() => {
    const el = ref.current;
    el?.focus();
    el?.setSelectionRange(el.value.length, el.value.length);
  }, []);
  const canSave = !saving && !tooLong && text !== initial;

  async function save() {
    if (!canSave || !token) {
      return;
    }
    setSaving(true);
    const result = await postUser({ description: text }, token);
    setSaving(false);
    if (!result.ok) {
      toast.error(`儲存失敗：${result.message}`);
      return;
    }
    updateUser({ description: text });
    onSaved(text);
    toast.success("自我介紹已更新");
  }

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <div className="mb-1 flex min-h-7 items-center gap-1.5">{heading}</div>
      <textarea
        value={text}
        ref={ref}
        rows={5}
        aria-label="自我介紹"
        onChange={(e) => setText(e.target.value)}
        className="w-full resize-none rounded-control border border-line-strong bg-surface px-3 py-2 text-[16px] text-ink-800 leading-[1.7] focus:border-brand-700/50 focus:outline-none focus:ring-2 focus:ring-brand-700/20"
        placeholder="介紹一下你自己"
      />
      <div className="flex items-center gap-2">
        <span
          aria-live="polite"
          className={`text-xs tabular-nums ${
            tooLong ? "text-danger-700" : "text-ink-500"
          }`}
        >
          {text.length}/{BIO_MAX}
        </span>
        <span className="flex-1" />
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="h-11 cursor-pointer rounded-control border border-line-strong bg-surface px-4 font-semibold text-ink-700 text-sm disabled:opacity-50"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={!canSave}
          className="h-11 cursor-pointer rounded-control bg-brand-700 px-4 font-semibold text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "儲存中…" : "儲存"}
        </button>
      </div>
    </form>
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

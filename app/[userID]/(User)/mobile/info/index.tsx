import Image from "next/image";
import {
  type Dispatch,
  Fragment,
  type SetStateAction,
  useEffect,
  useState,
} from "react";
import ReactDOMServer from "react-dom/server";
import { Tooltip } from "react-tooltip";
import Swal from "sweetalert2";
// APIs
import {
  JoinSigAPI,
  ReadJoinSigAPI,
} from "@/app/[userID]/(User)/apis/JoinSigAPI";
// Config
import { badgeList } from "@/app/[userID]/(User)/config/badge";
import Linkify from "@/components/Linkify/Linkify";
import type { Sig } from "@/interfaces/Sig";
// Interfaces
import type { User } from "@/interfaces/User";
import type { ApiFailure } from "@/modules/api/client";
import { CustomStatus } from "@/modules/customStatusCode";
import { jumpOut } from "@/utils/jumpOut";
import { isSubmitEnter } from "@/utils/keyboard";
// Hooks
import { useUserAccount } from "@/utils/useUserAccount";
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
  const { token, isLoading: authLoading } = useUserAccount();
  const [joinRequest, setJoinRequest] = useState("");

  // "" = unknown yet (button disabled); "none" = no request, may apply.
  useEffect(() => {
    const sigId = accountData?._id;
    if (dataType !== "sig" || !sigId || authLoading) {
      return;
    }
    if (!token) {
      // Logged out: the button stays usable and asks the user to log in.
      setJoinRequest("none");
      return;
    }
    const controller = new AbortController();
    (async () => {
      const response = await ReadJoinSigAPI(sigId, token, controller.signal);
      if (!controller.signal.aborted) {
        setJoinRequest((response.ok && response.data?.state) || "none");
      }
    })();
    return () => controller.abort();
  }, [accountData?._id, dataType, token, authLoading]);

  const JumpOut = jumpOut;

  const ApplySIGForm = [
    <Fragment key="ApplySIGForm">
      <span>Introduce yourself</span>
      <br />
      <textarea
        id="aboutYou"
        className={`swal2-textarea ${styles.JoinSIGFormInput}`}
        style={{ height: "5rem" }}
        maxLength={JOIN_ANSWER_MAX}
        placeholder="I am ..."
      />
      <br />
      <br />
      <span>Reasons of join this SIG</span>
      <br />
      <textarea
        id="whyJoin"
        className={`swal2-textarea ${styles.JoinSIGFormInput}`}
        style={{ height: "5rem" }}
        maxLength={JOIN_ANSWER_MAX}
        placeholder="I want to join ..."
      />
      <br />
      <br />
      <span>Topic you are interested in</span>
      <br />
      <textarea
        id="whichTopic"
        className={`swal2-textarea ${styles.JoinSIGFormInput}`}
        style={{ height: "5rem" }}
        maxLength={JOIN_ANSWER_MAX}
        placeholder="I am interest in ..."
      />
    </Fragment>,
  ];

  function JoinSIGhandle() {
    if (!token) {
      return Swal.fire({
        title: "Please login first",
        text: "You must login to join a SIG",
        icon: "warning",
        confirmButtonText: "Confirm",
      });
    }

    let aboutYou: HTMLTextAreaElement;
    let whyJoin: HTMLTextAreaElement;
    let whichTopic: HTMLTextAreaElement;

    Swal.fire({
      title: "Fill up the following questions",
      html: ReactDOMServer.renderToString(ApplySIGForm[0]),
      confirmButtonText: "Apply",
      cancelButtonText: "Cancel",
      showCancelButton: true,
      focusConfirm: false,
      didOpen: () => {
        const popup = Swal.getPopup() as HTMLElement;
        aboutYou = popup.querySelector("#aboutYou") as HTMLTextAreaElement;
        whyJoin = popup.querySelector("#whyJoin") as HTMLTextAreaElement;
        whichTopic = popup.querySelector("#whichTopic") as HTMLTextAreaElement;
        // Enter submits, Shift+Enter starts a new line; an Enter that picks
        // an IME candidate (注音/拼音) does neither.
        for (const field of [aboutYou, whyJoin, whichTopic]) {
          field.onkeydown = (e: KeyboardEvent) => {
            if (isSubmitEnter(e)) {
              e.preventDefault();
              Swal.clickConfirm();
            }
          };
        }
      },
      preConfirm: async () => {
        const aboutRes = aboutYou.value.trim();
        const joinRes = whyJoin.value.trim();
        const topicRes = whichTopic.value.trim();
        if (!aboutRes || !joinRes || !topicRes) {
          Swal.showValidationMessage("Please fill up the following questions");
          return false;
        }

        const res = await JoinSigAPI(
          {
            sig: accountData?._id ?? "",
            q1: aboutRes,
            q2: joinRes,
            q3: topicRes,
          },
          token ?? "",
        );

        if (res.ok) {
          setJoinRequest("pending");
          Swal.fire({
            title: "Success",
            text: "You have successfully applied to join this SIG",
            icon: "success",
            confirmButtonText: "OK",
          });
        } else {
          Swal.fire({
            title: "Error",
            text: joinErrorMessage(res),
            icon: "error",
            confirmButtonText: "Confirm",
          });
        }
      },
    });
  }

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
              alt="Avatar"
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
            {dataType === "sig" &&
              accountData?._id !== "652d60b842cdf6a660c2b778" && [
                // ID of announcement SIG
                <button
                  type="button"
                  className={styles.joinBtn}
                  onClick={JoinSIGhandle}
                  key={"Join SIG Button"}
                  disabled={
                    joinRequest === "pending" ||
                    joinRequest === "accepted" ||
                    isLoading ||
                    joinRequest === ""
                  }
                >
                  {joinRequest === "pending"
                    ? "Pending"
                    : joinRequest === "accepted"
                      ? "Joined"
                      : "Join SIG"}
                </button>,
              ]}
            {accountData?.badge ? <BadgeList userData={accountData} /> : null}
          </div>
          <hr className={styles.contentHR} />
          <div className={styles.descriptionTitleWrapper}>
            <h1 className={styles.descriptionTitle}>ABOUT ME</h1>
          </div>
          <div className={styles.description}>
            <Linkify
              componentDecorator={(decoratedHref, decoratedText, key) => (
                <button
                  type="button"
                  key={key}
                  onClick={() => {
                    JumpOut(decoratedHref);
                  }}
                >
                  {decoratedText}
                </button>
              )}
            >
              {accountData?.description?.split("\n").map((line, index) => (
                <p key={`${index}-${line}`}>{line}</p>
              ))}
            </Linkify>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Backend limit for each join-form answer. */
const JOIN_ANSWER_MAX = 250;

function joinErrorMessage(result: ApiFailure) {
  switch (result.status) {
    case CustomStatus.ALREADY_JOINED:
      return "你已經是這個 SIG 的成員";
    case CustomStatus.ALREADY_APPLIED:
      return "你已經申請過了，請等待審核";
    case CustomStatus.INVALID_CONTENT_LENGTH:
      return `每題最多 ${JOIN_ANSWER_MAX} 字`;
    default:
      return result.message;
  }
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

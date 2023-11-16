import Image from "next/image";
import { Tooltip } from "react-tooltip";
import { Fragment } from "react";
import Linkify from "react-linkify";
import Swal from "sweetalert2";
import ReactDOMServer from "react-dom/server";
import { useState } from "react";

// Styles
import styles from "./Info.module.scss";

// Interfaces
import { User } from "@/interfaces/User";
import { Sig } from "@/interfaces/Sig";

// Types
import { TJoinSigAPI } from "@/app/[userID]/(User)/types/joinSigAPI";

// API
import { JoinSigAPI } from "@/app/[userID]/(User)/apis/JoinSigAPI";

// Hooks
import { useUserAccount } from "@/utils/useUserAccount";

export default function Info({
  user: accountData,
  isLoading,
  dataType,
}: {
  user: User | Sig | null;
  isLoading: boolean;
  dataType: String | null;
}) {
  const { token } = useUserAccount();

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

  const ApplySIGForm = [
    <Fragment key="ApplySIGForm">
      <span>Introduce yourself</span>
      <br />
      <textarea
        id="aboutYou"
        className={"swal2-textarea " + styles.JoinSIGFormInput}
        style={{ height: "5rem" }}
        placeholder="I am ..."
      />
      <br />
      <br />
      <span>Reasons of join this SIG</span>
      <br />
      <textarea
        id="whyJoin"
        className={"swal2-textarea " + styles.JoinSIGFormInput}
        style={{ height: "5rem" }}
        placeholder="I want to join ..."
      />
      <br />
      <br />
      <span>Topic you are interested in</span>
      <br />
      <textarea
        id="whichTopic"
        className={"swal2-textarea " + styles.JoinSIGFormInput}
        style={{ height: "5rem" }}
        placeholder="I am interest in ..." />
    </Fragment>
  ];

  function JoinSIGhandle() {
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
        const popup = Swal.getPopup()!;
        aboutYou = popup.querySelector("#aboutYou") as HTMLTextAreaElement;
        whyJoin = popup.querySelector("#whyJoin") as HTMLTextAreaElement;
        whichTopic = popup.querySelector("#whichTopic") as HTMLTextAreaElement;
        aboutYou.onkeyup = (e: any) => e.key === "Enter" && Swal.clickConfirm();
        whyJoin.onkeyup = (e: any) => e.key === "Enter" && Swal.clickConfirm();
        whichTopic.onkeyup = (e: any) => e.key === "Enter" && Swal.clickConfirm();
      },
      preConfirm: async () => {
        const aboutRes = aboutYou.value;
        const joinRes = whyJoin.value;
        const topicRes = whichTopic.value;
        if (!aboutRes || !joinRes || !topicRes) {
          Swal.showValidationMessage("Please fill up the following questions");
        }

        const res = await JoinSigAPI({ sig: accountData?._id!, q1: aboutRes, q2: joinRes, q3: topicRes }, token!);

        if (res.status === 2000) {
          Swal.fire({
            title: "Success",
            text: "You have successfully applied to join this SIG",
            icon: "success",
            confirmButtonText: "OK",
          });
        } else {
          Swal.fire({
            title: "Error",
            text: "Something went wrong, please try again later",
            icon: "error",
            confirmButtonText: "OK",
          });
        }

      },
    });
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
          <div className={styles.nameWrapper}>
            <div className={styles.name}>
              <h1>
                {accountData?.name}
              </h1>
              <p>
                {accountData && "@"}
                {accountData?.customId}
              </p>
            </div>
            <div className={styles.space}></div>
            {
              (dataType === "sig")
              &&
              [
                <button
                  className={styles.joinBtn}
                  onClick={JoinSIGhandle}
                  key={"Join SIG Button"}
                >
                  Join SIG
                </button>
              ]
            }
          </div>
          <hr className={styles.contentHR} />
          <h1 className={styles.descriptionTitle}>ABOUT ME</h1>
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
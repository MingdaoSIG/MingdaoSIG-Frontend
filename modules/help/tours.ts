import type { TourId } from "./types";

// The three guided tours (decision 2C): 發文, 加入 SIG, 報名活動. Each step
// spotlights an element marked `data-tour="<name>"` (the first one on
// screen). Loaded with the tour overlay only, never on its own.

export type TourStep = {
  /** The page the step belongs to: "any", an exact path or a pattern. */
  at: "any" | string | RegExp;
  /** Where the tour goes for this step when it is somewhere else. */
  href?: string;
  /** `data-tour` names, the first found wins. */
  target: string[];
  /** Phones use these names instead, when given. */
  mobileTarget?: string[];
  title: string;
  body: string;
  mobileBody?: string;
  /**
   * The element is a link to the next step's page: clicking it, or
   * 下一步, follows it.
   */
  follow?: boolean;
  /** Shown when the element is not on the page. */
  missing: string;
};

export type Tour = { id: TourId; title: string; steps: TourStep[] };

export const TOURS: Record<TourId, Tour> = {
  post: {
    id: "post",
    title: "發文",
    steps: [
      {
        at: "any",
        target: ["new-post"],
        title: "從「＋」開始寫",
        body: "按左側導覽列最下方藍色的「＋」，打開編輯器。",
        mobileBody: "按下方中間的「＋」，打開編輯器。",
        follow: true,
        missing: "這個頁面沒有發文按鈕，回到首頁再試一次。",
      },
      {
        at: "/new",
        href: "/new",
        target: ["editor-title"],
        title: "先寫標題",
        body: "在「標題」寫下這篇的主題，內文寫在下面的編輯區，右邊可以即時預覽。",
        mobileBody:
          "在「標題」寫下這篇的主題，內文寫在下面。下方的「寫作／預覽」可以切換預覽。",
        missing: "找不到編輯器，請重新整理頁面再試一次。",
      },
      {
        at: "/new",
        href: "/new",
        target: ["editor-body"],
        title: "寫內文",
        body: "工具列可以加上粗體、標題、清單、圖片與表格，圖片也能直接貼上或拖曳進來。登入時內容會自動存到雲端草稿。",
        missing: "找不到編輯區，請重新整理頁面再試一次。",
      },
      {
        at: "/new",
        href: "/new",
        target: ["editor-sig", "editor-settings-toggle"],
        mobileTarget: ["editor-publish"],
        title: "選 SIG、封面與標籤",
        body: "在右邊的設定選「發布到」哪個 SIG，再挑封面、標籤（最多 5 個），也可以加入系列。設定收起來時，按上方的「設定」打開。",
        mobileBody:
          "按「發布」會先打開「發布設定」：在這裡選 SIG、封面與標籤，再按一次「發布」。",
        missing: "找不到發布設定，請重新整理頁面再試一次。",
      },
      {
        at: "/new",
        href: "/new",
        target: ["editor-publish"],
        title: "按「發布」",
        body: "都準備好了就按「發布」。少填了標題、內文或 SIG，會在欄位下方提醒你。發布後按「查看貼文」就能看到它。",
        mobileBody:
          "在「發布設定」選好之後，按下方的「發布」。少填了什麼，會在欄位下方提醒你。",
        missing: "找不到「發布」按鈕，請重新整理頁面再試一次。",
      },
    ],
  },
  join: {
    id: "join",
    title: "加入 SIG",
    steps: [
      {
        at: "/explore",
        href: "/explore",
        target: ["explore-recruiting", "explore-sig"],
        title: "找到想加入的 SIG",
        body: "「探索」上方是正在招生的 SIG，下面是全部 SIG。點一個 SIG，打開它的頁面。",
        follow: true,
        missing: "這裡還沒有 SIG 可以顯示，請稍後再試一次。",
      },
      {
        at: /^\/@/,
        target: ["sig-join"],
        title: "申請加入",
        body: "按「申請加入」，回答 SIG 的問題後按「送出申請」。幹部審核後，結果會通知你。",
        missing:
          "這個 SIG 頁面沒有「申請加入」。你可能已經是成員，或是 SIG 的幹部、老師。",
      },
      {
        at: /^\/@/,
        target: ["sig-follow"],
        title: "只想看貼文？追蹤就好",
        body: "按「追蹤」，這個 SIG 的新貼文會出現在首頁的「我的 SIG」。追蹤不是加入，隨時可以取消。",
        missing:
          "成員不用另外追蹤，SIG 的新貼文已經會出現在首頁的「我的 SIG」。",
      },
    ],
  },
  event: {
    id: "event",
    title: "報名活動",
    steps: [
      {
        at: "/events",
        href: "/events",
        target: ["events-scope"],
        title: "選擇要看的活動",
        body: "「我的 SIG」只列你的 SIG 的活動，「全部」是所有 SIG，「已報名」是你報名過的。",
        missing: "找不到活動列表，請重新整理頁面再試一次。",
      },
      {
        at: "/events",
        href: "/events",
        target: ["event-rsvp"],
        title: "按「報名」",
        body: "按「報名」就完成了。有名額的活動會顯示「已報名 12 / 30 人」，報名後也可以「取消報名」。",
        missing: "這裡目前沒有可以報名的活動。換到「全部」看看，或之後再來。",
      },
      {
        at: "/events",
        href: "/events",
        target: ["event-calendar"],
        title: "加到行事曆",
        body: "按「加到 Google 日曆」或「下載 .ics」，就不會忘記活動時間。",
        missing: "這個活動沒有行事曆按鈕。",
      },
    ],
  },
};

export function stepAt(step: TourStep, pathname: string) {
  if (step.at === "any") {
    return true;
  }
  if (typeof step.at === "string") {
    return pathname === step.at;
  }
  let path = pathname;
  try {
    path = decodeURIComponent(pathname);
  } catch {
    // keep the raw path
  }
  return step.at.test(path);
}

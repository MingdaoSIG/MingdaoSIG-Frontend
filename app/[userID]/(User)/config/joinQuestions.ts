/**
 * The three questions of the 「申請加入 SIG」 form, in the order they are
 * sent as q1, q2 and q3. The admin panel shows the answers with the same
 * labels.
 */
export const JOIN_QUESTIONS = [
  { id: "aboutYou", label: "自我介紹", placeholder: "我是…" },
  {
    id: "whyJoin",
    label: "為什麼想加入這個 SIG",
    placeholder: "我想加入是因為…",
  },
  { id: "whichTopic", label: "有興趣的主題", placeholder: "我對…有興趣" },
] as const;

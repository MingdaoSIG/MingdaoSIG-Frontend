import type { TPostAPI } from "@/components/PostEditor/types/postAPI";

const sigDefaultCover: { [key: string]: string } = {
  "651799ebfa1d45d97b139864": "653296b40b891d1f6b5b4412", // 資安
  "6529ed87df4ae96f279cd5e3": "653299ff0b891d1f6b5b4460", // 資訊程式設計
  "6529ee3cdf4ae96f279cd5e4": "653297ed0b891d1f6b5b4416", // 機器人
  "6529ee57df4ae96f279cd5e5": "653299f10b891d1f6b5b445c", // 建築設計
  "6529eed9df4ae96f279cd5e6": "6532988f0b891d1f6b5b4432", // 生科動科與環境
  "6529eeeddf4ae96f279cd5e7": "653298e00b891d1f6b5b4446", // 醫學
  "6529efbfdf4ae96f279cd5ec": "6532983d0b891d1f6b5b4422", // 醫學相關
  "6529efe9df4ae96f279cd5ee": "6532982d0b891d1f6b5b441e", // 法政
  "6529effbdf4ae96f279cd5ef": "653298c70b891d1f6b5b4442", // 社心教育
  "6529f011df4ae96f279cd5f0": "65329a0f0b891d1f6b5b4464", // 音樂表藝
  "6529f05ddf4ae96f279cd5f1": "653298fa0b891d1f6b5b444e", // 大眾傳播
  "6529f06edf4ae96f279cd5f2": "653298490b891d1f6b5b4426", // 文史哲
  "6529f07ddf4ae96f279cd5f3": "653298eb0b891d1f6b5b444a", // 財經
  "6529f094df4ae96f279cd5f4": "653298b00b891d1f6b5b443e", // 無人機
  "6529f0a2df4ae96f279cd5f5": "653298620b891d1f6b5b442e", // 經濟與管理
  "6529f0c4df4ae96f279cd5f6": "653298a60b891d1f6b5b443a", // 元宇宙
  "6529f0dbdf4ae96f279cd5f7": "653298570b891d1f6b5b442a", // 直播
  "6529f0eedf4ae96f279cd5f8": "653298110b891d1f6b5b441a", // 科學教育
  "652d60b842cdf6a660c2b778": "653299930b891d1f6b5b4458", // 公告
  "65321d65e226c78161c22807": "653298990b891d1f6b5b4436", // 遊憩運動
  "65321d83e226c78161c22808": "653299040b891d1f6b5b4452", // 電機物理
};

export async function postAPI(
  { title, sig, hashtag, content, cover }: TPostAPI,
  token: string,
) {
  // console.log("postAPI", { title, sig, hashtag, content, cover });
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/post`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: title,
      sig: sig,
      hashtag: hashtag,
      content: content,
      cover: cover || sigDefaultCover[sig],
    }),
  });
  return await res.json();
}

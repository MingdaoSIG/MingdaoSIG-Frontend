import type { TAlertMessageConfigs } from "../types/alertMessageConfigs";

export const alertMessageConfigs: TAlertMessageConfigs = {
  noComment: {
    title: "還不能送出",
    text: "請輸入留言內容",
    icon: "error",
    confirmButtonText: "好",
    confirmButtonColor: "#0b5a83",
  },
  commentSuccess: {
    title: "留言成功",
    icon: "success",
    confirmButtonText: "好",
    confirmButtonColor: "#0b5a83",
  },
  otherError: {
    title: "留言失敗",
    text: "發生錯誤，請稍後再試",
    icon: "error",
    confirmButtonText: "好",
    confirmButtonColor: "#0b5a83",
  },
};

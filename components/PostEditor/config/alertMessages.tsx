import type { TAlertMessageConfigs } from "@/components/PostEditor/types/alertMessageConfigs";

const BRAND = "#0b5a83";

export const alertMessageConfigs: TAlertMessageConfigs = {
  titleError: {
    title: "還不能發布",
    text: "請輸入標題",
    icon: "error",
    confirmButtonText: "好",
    confirmButtonColor: BRAND,
  },
  sigError: {
    title: "還不能發布",
    text: "請選擇 SIG",
    icon: "error",
    confirmButtonText: "好",
    confirmButtonColor: BRAND,
  },
  Success: {
    title: "發布成功",
    icon: "success",
    confirmButtonText: "查看貼文",
    confirmButtonColor: BRAND,
  },
  PermissionError: {
    title: "無法發布",
    text: "你沒有在這個 SIG 發文的權限",
    icon: "error",
    confirmButtonText: "改選其他 SIG",
    confirmButtonColor: BRAND,
  },
  OthersError: {
    title: "發布失敗",
    text: "發生錯誤，請稍後再試",
    icon: "error",
    confirmButtonText: "好",
    confirmButtonColor: BRAND,
  },
};

import type { TAlertMessageConfigs } from "../types/alertMessageConfigs";

export const alertMessageConfigs: TAlertMessageConfigs = {
  noComment: {
    title: "Error!",
    text: "Please enter comment!",
    icon: "error",
    confirmButtonText: "OK",
    confirmButtonColor: "#ff0000",
  },
  noLogin: {
    title: "Error!",
    text: "Please login to comment!",
    icon: "error",
    confirmButtonText: "OK",
    confirmButtonColor: "#ff0000",
  },
  commentSuccess: {
    title: "Success!",
    text: "Comment success!",
    icon: "success",
    confirmButtonText: "OK",
    confirmButtonColor: "#0090BD",
  },
  otherError: {
    title: "Error!",
    text: "Something went wrong. Please try again later.",
    icon: "error",
    confirmButtonText: "OK",
    confirmButtonColor: "#ff0000",
  },
};

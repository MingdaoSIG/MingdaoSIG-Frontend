import type { TAlertMessageConfigs } from "@/components/PostEditor/types/alertMessageConfigs";

export const alertMessageConfigs: TAlertMessageConfigs = {
  titleError: {
    title: "Error!",
    text: "Please enter title!",
    icon: "error",
    confirmButtonText: "OK",
    confirmButtonColor: "#ff0000",
  },
  sigError: {
    title: "Error!",
    text: "Please select SIG",
    icon: "error",
    confirmButtonText: "OK",
    confirmButtonColor: "#ff0000",
  },
  Success: {
    title: "Success!",
    text: "Post created!",
    icon: "success",
    confirmButtonText: "View the post",
    confirmButtonColor: "#0090BD",
  },
  PermissionError: {
    title: "Error!",
    text: "You have no permission to post in this sig.",
    icon: "error",
    confirmButtonText: "Choose another sig",
    confirmButtonColor: "#ff0000",
  },
  OthersError: {
    title: "Error!",
    text: "Something went wrong. Please try again later.",
    icon: "error",
    confirmButtonText: "OK",
    confirmButtonColor: "#ff0000",
  },
};

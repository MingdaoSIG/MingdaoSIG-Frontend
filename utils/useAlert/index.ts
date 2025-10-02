import { useState } from "react";
import Swal, { type SweetAlertOptions } from "sweetalert2";

const useAlert = () => {
  const [isLoading, setIsLoading] = useState(false);

  const showAlert = (options: SweetAlertOptions) => {
    return Swal.fire(options);
  };

  const showLoading = () => {
    setIsLoading(true);
    return Swal.fire({
      title: "Loading...",
      allowOutsideClick: false,
    });
  };

  const hideLoading = () => {
    setIsLoading(false);
    Swal.close();
  };

  return {
    showAlert,
    showLoading,
    hideLoading,
    isLoading,
  };
};

export default useAlert;

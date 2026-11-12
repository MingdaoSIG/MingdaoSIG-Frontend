import Swal from "sweetalert2";
import { toast } from "@/components/mobile/Toast";
import { isMobileViewport } from "@/utils/useIsMobile";

/**
 * A short result that needs no answer: the app's toast on phones (the
 * fixed mobile header covers SweetAlert's toast), a SweetAlert toast at
 * the top on desktop (desktop pages mount no toast host).
 */
export function notice(
  type: "success" | "error" | "info",
  message: string,
  action?: { label: string; onClick: () => void },
) {
  if (isMobileViewport()) {
    toast[type](message, action ? { action } : undefined);
    return;
  }
  void Swal.fire({
    toast: true,
    position: "top",
    icon: type,
    title: message,
    showConfirmButton: Boolean(action),
    confirmButtonText: action?.label,
    confirmButtonColor: "#0b5a83",
    timer: type === "error" || action ? 5000 : 2500,
    timerProgressBar: true,
  }).then((result) => {
    if (result.isConfirmed) {
      action?.onClick();
    }
  });
}

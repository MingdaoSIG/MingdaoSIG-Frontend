import Swal from "sweetalert2";

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function validateUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    if (urlObj.protocol !== "http:" && urlObj.protocol !== "https:") {
      console.warn(
        "Blocked potentially dangerous URL protocol:",
        urlObj.protocol,
      );
      return null;
    }
    return url;
  } catch {
    try {
      const urlWithProtocol = `https://${url}`;
      new URL(urlWithProtocol);
      return urlWithProtocol;
    } catch {
      console.warn("Invalid URL:", url);
      return null;
    }
  }
}

export function jumpOut(url: string) {
  const validatedUrl = validateUrl(url);
  if (!validatedUrl) {
    return;
  }

  Swal.fire({
    title: "即將離開 MDSIG",
    html:
      "<p>這個連結會前往<br/><strong>" +
      escapeHtml(validatedUrl) +
      "</strong><br/>確定要開啟嗎？</p>",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "開啟連結",
    cancelButtonText: "取消",
    confirmButtonColor: "#0b5a83",
  }).then((res) => {
    if (res.isConfirmed) {
      window.open(validatedUrl, "_blank", "noopener,noreferrer");
    }
  });
}

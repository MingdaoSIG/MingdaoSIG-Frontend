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
    title: "<strong>HOLD UP</strong>",
    html:
      "<p>This link will take you to <br/><strong>" +
      escapeHtml(validatedUrl) +
      "</strong><br/>Are you sure you want to go there?</p>",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yep",
    cancelButtonText: "Cancel",
  }).then((res) => {
    if (res.isConfirmed) {
      window.open(validatedUrl, "_blank", "noopener,noreferrer");
    }
  });
}

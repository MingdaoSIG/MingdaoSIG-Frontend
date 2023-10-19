const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function imageUpload(file: any, token: string) {
  return fetch(`${API_URL}/image`, {
    method: "POST",
    headers: {
      "Content-Type": "image/webp",
      Authorization: "Bearer " + token,
    },
    body: file,
  });
}

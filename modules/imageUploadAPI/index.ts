const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function imageUpload(file: any, token: any) {
  return fetch(`${API_URL}/image`, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + token,
    },
    body: file,
  });
}

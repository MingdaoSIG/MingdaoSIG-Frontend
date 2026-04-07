const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function imageUpload(file: BodyInit, token: string | null) {
  return fetch(`${API_URL}/image`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: file,
  });
}

import { TThread } from "@/interfaces/Thread";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function getSigDataById(id: string) {
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 3000);

    const response = await (
      await fetch(`${API_URL}/sig/${id}`, {
        method: "GET",
        signal: controller.signal,
      })
    ).json();

    return (response as TThread) || "";
  } catch (error) {
    return "";
  }
}

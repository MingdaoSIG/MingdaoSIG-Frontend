import { IThread } from "@/interface/Thread.interface";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function GetSigDataById(id: string) {
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 3000);

    const response = await (await fetch(`${API_URL}/sig/${id}`, {
      method: "GET",
      signal: controller.signal
    })).json();

    return response as IThread || "";
  } catch (error) {
    return "";
  }
}
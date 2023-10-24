import { Dispatch, SetStateAction } from "react";

export async function getSigListAPI(
  setSIGs?: Dispatch<SetStateAction<unknown[]>>
) {
  try {
    const res = await (
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sig/list`, {
        method: "GET",
      })
    ).json();

    return setSIGs ? setSIGs(res.data) : res.data;
  } catch (error) {
    console.error(error);
  }
}

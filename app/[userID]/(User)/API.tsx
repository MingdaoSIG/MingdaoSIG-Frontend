import { IThread } from "@/interface/Thread.interface";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function GetUserPostListAPI(
  user: {
    _id: string;
    name: string;
    description: string;
    avatar: string;
    customId: string;
  },
  setPosts: Dispatch<SetStateAction<IThread[]>>
) {
  try {
    const res = await (
      await fetch(`${API_URL}/post/list/user/${user._id}`, {
        method: "GET",
      })
    ).json();

    setPosts(res.postData);
    return;
  } catch (error) {
    console.log(error);
  }
}

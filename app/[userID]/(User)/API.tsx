import { IThread } from "@/interfaces/Thread.interface";
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

    setPosts(res.data);
    return;
  } catch (error) {
    console.log(error);
  }
}

export async function GetSIGPostListAPI(
  sig: {
    _id: string;
    name: string;
    description: string;
    avatar: string;
    customId: string;
  },
  setPosts: Dispatch<SetStateAction<IThread[]>>,
  setStatus: Dispatch<SetStateAction<string>>
) {
  try {
    const res = await (
      await fetch(`${API_URL}/post/list/sig/${sig._id}`, {
        method: "GET",
      })
    ).json();

    setPosts(res.data);
    setStatus("success2");
    return;
  } catch (error) {
    console.log(error);
  }
}

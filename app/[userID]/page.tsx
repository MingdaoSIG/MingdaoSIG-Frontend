"use client";

import {  useEffect, useState } from "react";

import { useRouter, notFound } from "next/navigation";

import SplitBlock from "../(Layout)/splitBlock";
import { InfinityThreadsList, ThreadsListSkeleton } from "@/components/Threads/desktop/ThreadsList";
import useIsMobile from "@/utils/useIsMobile";
import { Sig, User } from "@/interfaces/User";
import Info from "./(User)/desktop/Info";
import { useSigPost, useUserPost } from "@/components/usePost";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function UserPage({ params }: { params: { userID: string } }) {
  if (!decodeURIComponent(params.userID).startsWith("@")) {
    notFound();
  }

  const id = decodeURIComponent(params.userID);
  const route = useRouter();
  const isMobile = useIsMobile();

  const [isLoading, setIsLoading] = useState(true);
  const [dataType, setDataType] = useState<"user" | "sig" | null>(null);
  const [data, setData] = useState<User | Sig | null>(null);

  useEffect(() => {
    (async () => {
      const userData = await GetUser(id);
      const sigData = await GetSIG(id);

      setIsLoading(true);
      if (!(userData && sigData)) {
        setData(userData || sigData || null);
        setDataType(userData ? "user" : sigData ? "sig" : null);
        return setIsLoading(false);
      } else {
        setData(null);
        setDataType(null);
        return setIsLoading(false);
      }
    })();
  }, []);

  if (!isLoading && dataType === null) {
    return (
      <div className="flex flex-col m-auto">
        <h1 className="text-[50px]">User or SIG Not Found.</h1>
        <button
          className="bg-[#0090BD] bg-opacity-60 rounded-2xl w-[180px] h-[60px] block m-auto text-white mt-5 text-[20px]"
          onClick={() => {
            route.push("/");
          }}
        >
          Back to home
        </button>
      </div>
    );
  }

  return isMobile ? (
    <></>
  ) : (
    <SplitBlock>
      {isLoading ? (
        <ThreadsListSkeleton repeat={3} height="auto" />
      ) : (
        dataType === "user" ? (
          <UserInfinityThreadList id={data?._id!} />
        ) : (
          <SIGInfinityThreadList id={data?._id!} />
        )
      )}
      <Info user={data} isLoading={isLoading} />
    </SplitBlock >
  );
}

function UserInfinityThreadList({ id }: { id: string }) {
  const pageSize = 10;
  const { data, fetchNextPage, isFetchingNextPage, isLoading } = useUserPost(id, { pageSize });

  return isLoading ? (
    <ThreadsListSkeleton repeat={3} height="auto" />
  ) : (
    <InfinityThreadsList data={data} height="auto" fetchNextPage={fetchNextPage} isFetchingNextPage={isFetchingNextPage} />
  );
}

function SIGInfinityThreadList({ id }: { id: string }) {
  const pageSize = 10;
  const { data, fetchNextPage, isFetchingNextPage, isLoading } = useSigPost(id, { pageSize });

  return isLoading ? (
    <ThreadsListSkeleton repeat={3} height="auto" />
  ) : (
    <InfinityThreadsList data={data} height="auto" fetchNextPage={fetchNextPage} isFetchingNextPage={isFetchingNextPage} />
  );
}

async function GetUser(userId: string) {
  try {
    const response = await (
      await fetch(`${API_URL}/user/${userId.toLowerCase()}`, {
        method: "GET",
      })
    ).json();

    if (response.status !== 2000) throw new Error("Internal Error");

    return response.data;
  } catch (error) {
    return false;
  }
}

async function GetSIG(userId: string) {
  try {
    const response = await (
      await fetch(`${API_URL}/sig/${userId.toLowerCase()}`, {
        method: "GET",
      })
    ).json();

    if (response.status !== 2000) throw new Error("Internal Error");

    return response.data;
  } catch (error) {
    return false;
  }
}
"use client";

import { useEffect, useState } from "react";

import { useRouter, notFound } from "next/navigation";

import SplitBlock from "../(Layout)/splitBlock";
import {
  InfinityThreadsList,
  ThreadsListSkeleton,
} from "@/components/Threads/desktop/ThreadsList";
import useIsMobile from "@/utils/useIsMobile";
import { User } from "@/interfaces/User";
import { Sig } from "@/interfaces/Sig";
import Info from "./(User)/desktop/Info";
import { useSigPost, useUserPost } from "@/utils/usePost";

import styles from "./user.module.scss";
import Link from "next/link";

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isLoading && dataType === null) {
    return (
      <div className={styles.notFound}>
        <h1>User or SIG Not Found.</h1>
        <Link href={"/"} className={styles.backToHome}>
          Back to Home
        </Link>
      </div>
    );
  }

  return isMobile ? (
    <></>
  ) : (
    <SplitBlock>
      {isLoading ? (
        <ThreadsListSkeleton repeat={3} height="auto" />
      ) : dataType === "user" ? (
        <UserInfinityThreadList id={data?._id!} />
      ) : (
        <SIGInfinityThreadList id={data?._id!} />
      )}
      <Info user={data} isLoading={isLoading} />
    </SplitBlock>
  );
}

function UserInfinityThreadList({ id }: { id: string }) {
  const pageSize = 10;
  const { data, fetchNextPage, isFetchingNextPage, isLoading } = useUserPost(
    id,
    { pageSize }
  );

  return isLoading ? (
    <ThreadsListSkeleton repeat={3} height="auto" />
  ) : (
    <InfinityThreadsList
      data={data}
      height="auto"
      fetchNextPage={fetchNextPage}
      isFetchingNextPage={isFetchingNextPage}
    />
  );
}

function SIGInfinityThreadList({ id }: { id: string }) {
  const pageSize = 10;
  const { data, fetchNextPage, isFetchingNextPage, isLoading } = useSigPost(
    id,
    { pageSize }
  );

  return isLoading ? (
    <ThreadsListSkeleton repeat={3} height="auto" />
  ) : (
    <InfinityThreadsList
      data={data}
      height="auto"
      fetchNextPage={fetchNextPage}
      isFetchingNextPage={isFetchingNextPage}
    />
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

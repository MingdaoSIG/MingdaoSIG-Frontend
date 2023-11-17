"use client";

import { useEffect, useState } from "react";

import { notFound } from "next/navigation";

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

import { NotFound } from "@/components/NotFound";
import sigAPI from "@/modules/sigAPI";

export default function UserPage({ params }: { params: { userID: string } }) {
  if (!decodeURIComponent(params.userID).startsWith("@")) {
    notFound();
  }

  const accountId = decodeURIComponent(params.userID);
  const isMobile = useIsMobile();

  const [isLoading, setIsLoading] = useState(true);
  const [dataType, setDataType] = useState<"user" | "sig" | null>(null);
  const [data, setData] = useState<User | Sig | null>(null);

  useEffect(() => {
    (async () => {
      setIsLoading(true);

      const { data, dataType } = await getAccountData(accountId);

      setData(data);
      setDataType(dataType);

      return setIsLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isLoading && dataType === null) {
    return (
      <NotFound
        content={{
          message: "User or SIG Not Found"
        }}
        image={{
          show: false
        }}
      />
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
      <Info user={data} isLoading={isLoading} dataType={dataType} />
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
      dataType="top"
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
      dataType="top"
    />
  );
}

async function getUser(userId: string) {
  try {
    return await sigAPI.getUserData(userId);
  } catch (error) {
    return false;
  }
}

async function getSIG(userId: string) {
  try {
    return await sigAPI.getSigData(userId);
  } catch (error) {
    return false;
  }
}

async function getAccountData(accountId: string): Promise<{
  data: User | Sig | null;
  dataType: "user" | "sig" | null;
}> {
  const userData = await getUser(accountId);
  const sigData = await getSIG(accountId);

  if (!(userData && sigData)) {
    return {
      data: userData || sigData || null,
      dataType: userData ? "user" : sigData ? "sig" : null
    };
  } else {
    return {
      data: null,
      dataType: null
    };
  }
}

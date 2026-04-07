"use client";

import { notFound } from "next/navigation";
import { use, useEffect, useState } from "react";
import { NotFound } from "@/components/NotFound";
import {
  InfinityThreadsList,
  ThreadsListSkeleton,
} from "@/components/Threads/desktop/ThreadsList";
import type { Sig } from "@/interfaces/Sig";
import type { User } from "@/interfaces/User";
import sigAPI from "@/modules/sigAPI";
// Validation
import { isValidCustomId, sanitizeUrlParam } from "@/modules/validation";
import useIsMobile from "@/utils/useIsMobile";
import { useSigPost, useUserPost } from "@/utils/usePost";
import SplitBlock from "../(Layout)/splitBlock";
import Info from "./(User)/desktop/Info";
import ProfileMobile from "./(User)/mobile";

export default function UserPage({
  params,
}: {
  params: Promise<{ userID: string }>;
}) {
  // Unwrap the params Promise using React.use()
  const resolvedParams = use(params);
  const rawUserID = decodeURIComponent(resolvedParams.userID);

  // 驗證 userID 格式
  if (!isValidCustomId(rawUserID)) {
    notFound();
  }

  // 清理 userID（防止路徑遍歷）
  const accountId = sanitizeUrlParam(rawUserID);
  const isMobile = useIsMobile();

  const [isLoading, setIsLoading] = useState(true);
  const [dataType, setDataType] = useState<"user" | "sig" | null>(null);
  const [data, setData] = useState<User | Sig | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    (async () => {
      setIsLoading(true);

      try {
        const { data, dataType } = await getAccountData(
          accountId,
          controller.signal,
        );

        if (isMounted) {
          setData(data);
          setDataType(dataType);
        }
      } catch (error: unknown) {
        if (
          error instanceof Error &&
          error.name !== "AbortError" &&
          isMounted
        ) {
          console.error("Failed to fetch account data:", error);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [accountId]);

  if (!isLoading && dataType === null) {
    return (
      <NotFound
        content={{
          message: "User or SIG Not Found",
        }}
        image={{
          show: false,
        }}
      />
    );
  }

  return isMobile ? (
    <ProfileMobile params={resolvedParams} />
  ) : (
    <SplitBlock>
      {isLoading ? (
        <ThreadsListSkeleton repeat={6} height="auto" />
      ) : dataType === "user" ? (
        <UserInfinityThreadList id={data?._id ?? ""} />
      ) : (
        <SIGInfinityThreadList id={data?._id ?? ""} />
      )}
      <Info
        user={data}
        isLoading={isLoading}
        dataType={dataType}
        setInfo={setData}
      />
    </SplitBlock>
  );
}

function UserInfinityThreadList({ id }: { id: string }) {
  const pageSize = 10;
  const { data, fetchNextPage, isFetchingNextPage, isLoading } = useUserPost(
    id,
    { pageSize },
  );

  return isLoading ? (
    <ThreadsListSkeleton repeat={6} height="auto" />
  ) : (
    <InfinityThreadsList
      data={data}
      height="70dvh"
      fetchNextPage={fetchNextPage}
      isFetchingNextPage={isFetchingNextPage}
    />
  );
}

function SIGInfinityThreadList({ id }: { id: string }) {
  const pageSize = 10;
  const { data, fetchNextPage, isFetchingNextPage, isLoading } = useSigPost(
    id,
    { pageSize },
  );

  return isLoading ? (
    <ThreadsListSkeleton repeat={6} height="auto" />
  ) : (
    <InfinityThreadsList
      data={data}
      height="70dvh"
      fetchNextPage={fetchNextPage}
      isFetchingNextPage={isFetchingNextPage}
    />
  );
}

async function getUser(userId: string, signal?: AbortSignal) {
  try {
    return await sigAPI.getUserData(userId, signal);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }
    return false;
  }
}

async function getSIG(userId: string, signal?: AbortSignal) {
  try {
    return await sigAPI.getSigData(userId, signal);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }
    return false;
  }
}

async function getAccountData(
  accountId: string,
  signal?: AbortSignal,
): Promise<{
  data: User | Sig | null;
  dataType: "user" | "sig" | null;
}> {
  const [userData, sigData] = await Promise.all([
    getUser(accountId, signal),
    getSIG(accountId, signal),
  ]);

  if (!(userData && sigData)) {
    return {
      data: userData || sigData || null,
      dataType: userData ? "user" : sigData ? "sig" : null,
    };
  }
  return {
    data: null,
    dataType: null,
  };
}

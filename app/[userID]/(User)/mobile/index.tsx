import { useState, useEffect } from "react";
import { notFound } from "next/navigation";

// Interfaces
import type { User } from "@/interfaces/User";
import type { Sig } from "@/interfaces/Sig";

// Styles
import styles from "./mobile.module.scss";

// Components
import {
  InfinityThreadsList,
  ThreadsListSkeleton,
} from "@/components/Threads/mobile/ThreadsList";
import Info from "./info";

// apis
import sigAPI from "@/modules/sigAPI";

// Hooks
import { useSigPost, useUserPost } from "@/utils/usePost";

export default function ProfileMobile({
  params,
}: {
  params: { userID: string };
}) {
  // Note: params is already resolved when passed from parent
  if (!decodeURIComponent(params.userID).startsWith("@")) {
    notFound();
  }

  const accountId = decodeURIComponent(params.userID);

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
  }, [accountId]);

  return (
    <div className={styles.mobileProfile}>
      <Info
        user={data}
        isLoading={isLoading}
        dataType={dataType}
        setInfo={setData}
      />
      <div className="overflow-y-hidden mx-[0.5rem]">
        {isLoading ? (
          <ThreadsListSkeleton repeat={3} height="calc(100dvh - 21rem)" />
        ) : dataType === "user" ? (
          <UserInfinityThreadList id={data?._id!} />
        ) : (
          <SIGInfinityThreadList id={data?._id!} />
        )}
      </div>
    </div>
  );
}

function UserInfinityThreadList({ id }: { id: string }) {
  const pageSize = 10;
  const { data, fetchNextPage, isFetchingNextPage, isLoading } = useUserPost(
    id,
    { pageSize },
  );

  return isLoading ? (
    <ThreadsListSkeleton repeat={1} height="calc(100dvh - 21rem)" />
  ) : (
    <InfinityThreadsList
      data={data}
      height="calc(100dvh - 21rem)"
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
    <ThreadsListSkeleton repeat={10} height="calc(100dvh - 21rem)" />
  ) : (
    <InfinityThreadsList
      data={data}
      height="calc(100dvh - 21rem)"
      fetchNextPage={fetchNextPage}
      isFetchingNextPage={isFetchingNextPage}
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
      dataType: userData ? "user" : sigData ? "sig" : null,
    };
  } else {
    return {
      data: null,
      dataType: null,
    };
  }
}
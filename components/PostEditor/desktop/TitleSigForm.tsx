import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import type { Sig } from "@/interfaces/Sig";
import sigAPI from "@/modules/sigAPI";
import { useUserAccount } from "@/utils/useUserAccount";
import { announcementSigId } from "../config/announcement";
import type { TPostAPI } from "../types/postAPI";

interface Props {
  data: TPostAPI;
  handleFormEventFunction: (e: {
    target: { name: string; value: string | string[] };
  }) => void;
}

export default function TitleSigForm({ data, handleFormEventFunction }: Props) {
  const { status } = useSession();
  const { userData } = useUserAccount();

  const [sigs, setSigs] = useState<Sig[]>([]);
  const [announcementSigData, setAnnouncementSigData] = useState<Sig>();

  useEffect(() => {
    (async () => {
      try {
        const response = await sigAPI.getSigList();
        setSigs(response);
      } catch (error: unknown) {
        console.error(error instanceof Error ? error.message : error);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const response = await sigAPI.getSigData(announcementSigId);
        setAnnouncementSigData(response);
      } catch (error: unknown) {
        console.error(error instanceof Error ? error.message : error);
      }
    })();
  }, []);

  return (
    <div className="mb-3 flex h-11 w-full items-center overflow-hidden rounded-control border border-line bg-surface shadow-card">
      <input
        type="text"
        name="title"
        className="h-full flex-1 border-line border-r bg-surface pr-3 pl-4 text-ink-900 placeholder:text-ink-400 focus:outline-none"
        value={data?.title}
        placeholder="請輸入標題..."
        onChange={(e) => handleFormEventFunction(e)}
      />
      <div className="h-full w-[10.5rem] items-center justify-center bg-surface text-left">
        <select
          name="sig"
          value={data?.sig}
          className="h-full w-full px-2 text-left text-ink-800 focus:outline-none"
          onChange={(e) => {
            handleFormEventFunction(e);
          }}
        >
          <option value="">請選擇 SIG</option>
          {sigs?.map((sig) => {
            return (
              <option value={sig._id} key={sig._id}>
                {sig.name}
              </option>
            );
          })}
          {status === "authenticated" &&
            userData &&
            announcementSigData?.moderator?.includes(userData._id ?? "") && (
              <option value="652d60b842cdf6a660c2b778">公告</option>
            )}
        </select>
      </div>
    </div>
  );
}

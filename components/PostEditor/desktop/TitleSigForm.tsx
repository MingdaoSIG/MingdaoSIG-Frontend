import { Dispatch, SetStateAction, useState, useEffect } from "react";
import { TPostAPI } from "../types/postAPI";
import { Sig } from "@/interfaces/Sig";
import sigAPI from "@/modules/sigAPI";
import { announcementSigId } from "../config/announcement";
import { useUserAccount } from "@/utils/useUserAccount";
import { useSession } from "next-auth/react";

interface Props {
  data: TPostAPI;
  handleFormEventFunction: Function;
}

export default function TitleSigForm({ data, handleFormEventFunction }: Props) {
  const { status } = useSession();
  const { userData } = useUserAccount();

  const [sigs, setSigs] = useState<any[]>([]);
  const [announcementSigData, setAnnouncementSigData] = useState<Sig>();

  useEffect(() => {
    (async () => {
      try {
        const response = await sigAPI.getSigList();
        setSigs(response);
      } catch (error: any) {
        console.error(error.message);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const response = await sigAPI.getSigData(announcementSigId);
        setAnnouncementSigData(response);
      } catch (error: any) {
        console.error(error.message);
      }
    })();
  }, []);

  return (
    <div className="w-full mb-2 h-10 flex items-center">
      <input
        type="text"
        name="title"
        className="h-full flex-1 rounded-l-full pl-5 pr-3 border-r border-gray-300"
        value={data?.title}
        placeholder="請輸入標題"
        onChange={(e) => handleFormEventFunction(e)}
      />
      <div className="h-full w-[10.5rem] rounded-r-full bg-white text-left items-center justify-center">
        <select
          name="sig"
          value={data?.sig}
          className="h-full text-left rounded-r-full px-1"
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
            announcementSigData &&
            announcementSigData?.moderator?.includes(userData._id!) && (
              <option value="652d60b842cdf6a660c2b778">公告</option>
            )}
        </select>
      </div>
    </div>
  );
}

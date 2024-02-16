"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// Styles
import style from "./SigList.module.scss";

// Modules
import maxMatch from "@/modules/maxMatch";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const SIG = (child: any) => {
  return (
    <Link className={style.sig} href={`/@${child.customId}`}>
      {maxMatch(child.name).map((name, index) => (
        <p key={index}>{name}</p>
      ))}
    </Link>
  );
};

const Information = ({ sigListToggle }: { sigListToggle: Function }) => {
  const [sigs, setSigs] = useState<any>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await (
          await fetch(`${API_URL}/sig/list`, {
            method: "GET",
          })
        ).json();

        return setSigs(res.data);
      } catch (error) {
        console.log(error);
      }
    })();
  }, []);

  return (
    <div className={style.popup}>
      <div className={style.outer} onClick={() => sigListToggle(false)}></div>
      <div className={style.sigs}>
        {sigs.map((item: any) => {
          if (item._id !== "652d60b842cdf6a660c2b778") {
            return (
              <SIG
                _id={item._id}
                name={item.name}
                customId={item.customId}
                key={item._id}
              />
            );
          }
        })}
      </div>
    </div>
  );
};
export default Information;

import axios from "axios";
import { NextRequest } from "next/server";

export async function GET(req : NextRequest) {
  const url = new URL(req.url);
  const name = url.searchParams.get("name");
  const description = url.searchParams.get("description");

  if (!name) {
    return Response.json({"message": "Missing name parameter!"});
  }

  if (!description) {
    return Response.json({"message": "Missing description parameter!"});
  }

  const content = {
    username: "MDSIG Login",
    avatar_url: "https://sig.mingdao.edu.tw/images/logo_mobile.png",
    embeds: [
      {
        "title": name,
        "color": parseInt("0x34e718"),
        "fields": [
          {
            "name": "Description",
            "value": description,
            "inline": false
          },
        ]
      }
    ]
  };

  axios(String(process.env.NEXT_PUBLIC_WEBHOOK_LOGIN),{
    method: "POST",
    headers: {
      "Content-type": "application/json"
    },
    data: JSON.stringify(content),
  });
  return Response.json({"message": "Request Sent!"});
}

export const dynamic = "force-dynamic";
export const dynamicParams = false;
export const revalidate = false;
export const fetchCache = "auto";
export const runtime = "nodejs";
export const preferredRegion = "auto";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req : NextRequest) {
  const data = await req.formData();
  const content = {
    username: "MDSIG Login",
    avatar_url: "https://cdn.discordapp.com/attachments/1222932958667870279/1222933028259496080/sig2_pfp__1.png",
    embeds: [
      {
        "title":`${data.get("name")} ${((req.url.includes("localhost")) || (req.url.includes("-dev")) ? "(Development)" : "") }`,
        "description": data.get("description"),
        "color": parseInt("0x34e718"),
        "thumbnail": {
          "url": data.get("avatar"),
        },
        "fields": [
          {
            "name": "ID",
            "value": data.get("id"),
            "inline": true
          },
          {
            "name": "Custom ID",
            "value": data.get("customId"),
            "inline": true
          },
          {
            "name": "Identity",
            "value": data.get("identity"),
            "inline": true
          },
          {
            "name": "Email",
            "value": data.get("email"),
            "inline": true
          },
          {
            "name": "Badge",
            "value": data.get("badge") || "No Data",
            "inline": true
          },
          {
            "name": "\u200b",
            "value": "\u200b",
            "inline": true
          },
          {
            "name": "Code",
            "value": data.get("code"),
            "inline": true
          },
          {
            "name": "Class",
            "value": data.get("class"),
            "inline": true
          },
          {
            "name": "\u200b",
            "value": "\u200b",
            "inline": true
          },
        ],
        "timestamp": new Date().toISOString(),
        "footer": {
          "text": "MDSIG 2.0 Login System",
          "icon_url": "https://cdn.discordapp.com/attachments/1222932958667870279/1222933028259496080/sig2_pfp__1.png?ex=66180422&is=66058f22&hm=a0229ab4733f6a2c4d2db217500663987351acdee83ff724afcfddc84e61fc45&",
        },
      },
    ],
  };

  axios(String(process.env.NEXT_PUBLIC_WEBHOOK_LOGIN),{
    method: "POST",
    headers: {
      "Content-type": "application/json"
    },
    data: JSON.stringify(content),
  });
  
  return NextResponse.json({ "message": "Request Sent!" });
}

export const dynamic = "force-dynamic";
export const dynamicParams = false;
export const revalidate = false;
export const fetchCache = "auto";
export const runtime = "nodejs";
export const preferredRegion = "auto";
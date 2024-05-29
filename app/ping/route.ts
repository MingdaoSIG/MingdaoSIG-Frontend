import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import axios from "axios";

import ReadableTime from "@/modules/api/ReadableTime";
import GetOnlineAppVersion from "@/modules/api/GetOnlineAppVersion";


export async function GET() {
  const packageJSON = JSON.parse(readFileSync("./package.json").toString());
  const { mainVersion, developmentVersion } = await GetOnlineAppVersion();

  const apiResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/ping`);
  const apiData = apiResponse.data;

  const data: any = {
    "Frontend": {
      "status": "Online",
      "uptime": ReadableTime(Math.round(performance.now()))["string"],
      "currentVersion": packageJSON.version,
      "latestVersion": {
        "main": mainVersion,
        "development": developmentVersion
      },
      "upToDate": {
        "main": mainVersion <= packageJSON.version,
        "development": developmentVersion <= packageJSON.version
      },
    },  
    "Backend": {
      "status": apiData.service.replace("up", "Online") || "Offline",
      "uptime": apiData.uptime || "N/A",
      "currentVersion": apiData.version.current || "N/A",
      "latestVersion": apiData.version.latest || "N/A",
      "upToDate": apiData.version.upToDate || "N/A"
    }
  };


  return NextResponse.json(data);
}

export const dynamic = "force-dynamic";
export const dynamicParams = false;
export const revalidate = false;
export const fetchCache = "auto";
export const runtime = "nodejs";
export const preferredRegion = "auto";
import { NextResponse } from "next/server";
import { readFileSync } from "fs";

import ReadableTime from "@/modules/api/ReadableTime";
import GetOnlineAppVersion from "@/modules/api/GetOnlineAppVersion";


export async function GET() {
  const packageJSON = JSON.parse(readFileSync("./package.json").toString());
  const { mainVersion, developmentVersion } = await GetOnlineAppVersion();

  const data: any = {
    "service": "up",
    "uptime": ReadableTime(Math.round(performance.now()))["string"],
    "version": {
      "current": packageJSON.version,
      "latest": {
        "main": mainVersion,
        "development": developmentVersion
      },
      "upToDate": {
        "main": mainVersion === packageJSON.version,
        "development": developmentVersion === packageJSON.version
      }
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
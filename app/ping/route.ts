import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import axios from "axios";

import ReadableTime from "@/modules/api/ReadableTime";
import GetOnlineAppVersion from "@/modules/api/GetOnlineAppVersion";

export async function GET() {
  const packageJSON = JSON.parse(readFileSync("./package.json").toString());
  
  // Get online versions with fallback
  let mainVersion = "Unknown";
  let developmentVersion = "Unknown";
  try {
    const versions = await GetOnlineAppVersion();
    mainVersion = versions.mainVersion;
    developmentVersion = versions.developmentVersion;
  } catch (error) {
    console.error("Failed to get online app version:", error);
  }

  // Get backend status with fallback
  let backendData: any = {
    service: "unknown",
    uptime: "N/A",
    version: {
      current: "N/A",
      latest: "N/A",
      upToDate: "N/A",
    },
  };
  try {
    const apiResponse = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/ping`,
      { timeout: 5000 }
    );
    backendData = apiResponse.data;
  } catch (error) {
    console.error("Failed to get backend ping:", error);
  }

  const data: any = {
    Frontend: {
      status: "Online",
      uptime: ReadableTime(Math.round(performance.now()))["string"],
      currentVersion: packageJSON.version,
      latestVersion: {
        main: mainVersion,
        development: developmentVersion,
      },
      upToDate: {
        main: mainVersion !== "Unknown" && mainVersion >= packageJSON.version,
        development: developmentVersion !== "Unknown" && developmentVersion >= packageJSON.version,
      },
    },
    Backend: {
      status: backendData.service?.replace("up", "Online") || "Offline",
      uptime: backendData.uptime || "N/A",
      currentVersion: backendData.version?.current || "N/A",
      latestVersion: backendData.version?.latest || "N/A",
      upToDate: backendData.version?.upToDate || "N/A",
    },
  };

  return NextResponse.json(data);
}

export const dynamic = "force-dynamic";
export const dynamicParams = false;
export const revalidate = false;
export const fetchCache = "auto";
export const runtime = "nodejs";
export const preferredRegion = "auto";

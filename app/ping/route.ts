import axios from "axios";
import { NextResponse } from "next/server";
import GetOnlineAppVersion from "@/modules/api/GetOnlineAppVersion";
import ReadableTime from "@/modules/api/ReadableTime";
import packageJSON from "@/package.json";

interface BackendData {
  service?: string;
  uptime?: string;
  version?: {
    current: string;
    latest: string;
    upToDate: string | boolean;
  };
}

export async function GET() {
  const [onlineVersions, apiResponse] = await Promise.all([
    GetOnlineAppVersion(),
    axios
      .get<BackendData>(`${process.env.NEXT_PUBLIC_API_URL}/ping`)
      .catch(() => null),
  ]);

  const { mainVersion, developmentVersion } = onlineVersions;
  const apiData = apiResponse?.data || {};

  const currentFrontendVersion = packageJSON.version;

  const data = {
    frontend: {
      status: "Online",
      uptime: ReadableTime(Math.round(performance.now())).string,
      currentVersion: currentFrontendVersion,
      latestVersion: {
        main: mainVersion,
        development: developmentVersion,
      },
      upToDate: {
        main: mainVersion >= currentFrontendVersion,
        development: developmentVersion >= currentFrontendVersion,
      },
    },
    backend: {
      status: apiData.service?.replace("up", "Online") || "Offline",
      uptime: apiData.uptime || "N/A",
      currentVersion: apiData.version?.current || "N/A",
      latestVersion: apiData.version?.latest || "N/A",
      upToDate: apiData.version?.upToDate || "N/A",
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

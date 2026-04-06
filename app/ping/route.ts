import axios from "axios";
import { NextResponse } from "next/server";
import ReadableTime from "@/modules/api/ReadableTime";
import packageJSON from "@/package.json";

interface BackendData {
  service?: string;
  uptime?: string;
  version?: {
    current: string;
    latest: {
      main: string;
      development: string;
    };
    upToDate: {
      main: boolean;
      development: boolean;
    };
  };
}

async function getMainVersion(): Promise<string> {
  try {
    const API_URL =
      "https://raw.githubusercontent.com/MingdaoSIG/MingdaoSIG-Frontend/main/package.json";

    const githubToken = process.env.GITHUB_TOKEN;
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3.raw",
    };

    if (githubToken) {
      headers.Authorization = `token ${githubToken}`;
    }

    const response = await axios.get(API_URL, {
      headers,
      timeout: 10000,
    });

    const responseObj = response.data;
    const version = responseObj?.version;
    if (!version) return "Unknown";

    return version;
  } catch (error) {
    console.error("Failed to get main version:", error);
    return "Unknown";
  }
}

async function getDevelopmentVersion(): Promise<string> {
  try {
    const API_URL =
      "https://raw.githubusercontent.com/MingdaoSIG/MingdaoSIG-Frontend/development/package.json";

    const githubToken = process.env.GITHUB_TOKEN;
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3.raw",
    };

    if (githubToken) {
      headers.Authorization = `token ${githubToken}`;
    }

    const response = await axios.get(API_URL, {
      headers,
      timeout: 10000,
    });

    const responseObj = response.data;
    const version = responseObj?.version;
    if (!version) return "Unknown";

    return version;
  } catch (error) {
    console.error("Failed to get development version:", error);
    return "Unknown";
  }
}

export async function GET() {
  const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/ping`;

  const [mainVersion, developmentVersion, apiResponse] = await Promise.all([
    getMainVersion(),
    getDevelopmentVersion(),
    axios.get<BackendData>(apiUrl).catch((error) => {
      console.error(
        `[Ping] Failed to fetch backend data from ${apiUrl}:`,
        error.message,
      );
      return null;
    }),
  ]);

  const apiData = apiResponse?.data || {};

  if (!apiResponse) {
    console.warn(`[Ping] Backend API not available at ${apiUrl}`);
  } else {
    console.log(`[Ping] Successfully fetched backend data:`, {
      service: apiData.service,
      version: apiData.version?.current,
    });
  }

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
      latestVersion: apiData.version?.latest || {
        main: "N/A",
        development: "N/A",
      },
      upToDate: apiData.version?.upToDate || {
        main: false,
        development: false,
      },
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

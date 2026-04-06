import axios from "axios";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [mainVersion, developmentVersion] = await Promise.all([
      getMainVersion(),
      getDevelopmentVersion(),
    ]);

    return NextResponse.json({
      status: 2000,
      data: {
        mainVersion,
        developmentVersion,
      },
    });
  } catch (error) {
    console.error("Failed to get app version:", error);
    return NextResponse.json(
      {
        status: 5000,
        data: {
          mainVersion: "Unknown",
          developmentVersion: "Unknown",
        },
      },
      { status: 500 },
    );
  }
}

async function getMainVersion(): Promise<string> {
  try {
    const API_URL =
      "https://raw.githubusercontent.com/MingdaoSIG/MingdaoSIG-Frontend/main/package.json";

    // 使用伺服器端環境變數（不含 NEXT_PUBLIC_ 前綴）
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

    // 使用伺服器端環境變數（不含 NEXT_PUBLIC_ 前綴）
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

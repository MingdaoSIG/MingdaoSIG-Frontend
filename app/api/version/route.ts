import { NextResponse } from "next/server";
import { getBranchVersion } from "@/modules/api/getBranchVersion";

export async function GET() {
  try {
    const [mainVersion, developmentVersion] = await Promise.all([
      getBranchVersion("main"),
      getBranchVersion("development"),
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

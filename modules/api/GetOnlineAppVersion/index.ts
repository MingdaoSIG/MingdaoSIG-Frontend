"use client";

export default async function GetOnlineAppVersion() {
  try {
    const response = await fetch("/api/version");
    const data = await response.json();

    if (data.status === 2000) {
      return {
        mainVersion: data.data.mainVersion,
        developmentVersion: data.data.developmentVersion,
      };
    }

    throw new Error("Failed to get version");
  } catch (error) {
    console.error("Failed to get online app version:", error);
    return {
      mainVersion: "Unknown",
      developmentVersion: "Unknown",
    };
  }
}

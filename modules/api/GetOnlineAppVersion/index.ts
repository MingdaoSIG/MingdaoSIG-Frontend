import axios from "axios";

export default async function GetOnlineAppVersion() {
  const mainVersion = await getMainVersion();
  const developmentVersion = await getDevelopmentVersion();

  return {
    mainVersion,
    developmentVersion,
  };
}

async function getMainVersion(): Promise<string> {
  try {
    const API_URL =
      "https://raw.githubusercontent.com/MingdaoSIG/MingdaoSIG-Frontend/main/package.json";

    const response = await axios.get(API_URL, {
      headers: {
        Accept: "application/vnd.github.v3.raw",
        Authorization: `token ${process.env.NEXT_PUBLIC_GITHUB_TOKEN}`,
      },
      timeout: 5000,
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

    const response = await axios.get(API_URL, {
      headers: {
        Accept: "application/vnd.github.v3.raw",
        Authorization: `token ${process.env.NEXT_PUBLIC_GITHUB_TOKEN}`,
      },
      timeout: 5000,
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

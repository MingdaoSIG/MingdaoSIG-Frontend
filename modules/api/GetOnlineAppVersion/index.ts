import axios from "axios";



export default async function GetOnlineAppVersion() {
  try {
    const mainVersion = await getMainVersion();
    const developmentVersion = await getDevelopmentVersion();

    return {
      mainVersion,
      developmentVersion
    };
  } catch (error: any) {
    throw new Error(error.message);
  }
}

async function getMainVersion() {
  const API_URL = "https://raw.githubusercontent.com/MingdaoSIG/MingdaoSIG-Frontend/main/package.json";

  const response = await axios.get(
    API_URL,
    {
      headers: {
        Accept: "application/vnd.github.v3.raw",
        Authorization: `token ${process.env.NEXT_PUBLIC_GITHUB_TOKEN}`
      }
    }
  );

  const responseObj = response.data;
  const version = responseObj?.version;
  if (!version) throw new Error("Empty response object");

  return version;
}

async function getDevelopmentVersion() {
  const API_URL = "https://raw.githubusercontent.com/MingdaoSIG/MingdaoSIG-Frontend/development/package.json";

  const response = await axios.get(
    API_URL,
    {
      headers: {
        Accept: "application/vnd.github.v3.raw",
        Authorization: `token ${process.env.NEXT_PUBLIC_GITHUB_TOKEN}`
      }
    }
  );

  const responseObj = response.data;
  const version = responseObj?.version;
  if (!version) throw new Error("Empty response object");

  return version;
}
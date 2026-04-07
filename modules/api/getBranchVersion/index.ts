import axios from "axios";

export async function getBranchVersion(branch: string): Promise<string> {
  try {
    const apiUrl = `https://raw.githubusercontent.com/MingdaoSIG/MingdaoSIG-Frontend/${branch}/package.json`;

    const githubToken = process.env.GITHUB_TOKEN;
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3.raw",
    };

    if (githubToken) {
      headers.Authorization = `token ${githubToken}`;
    }

    const response = await axios.get(apiUrl, {
      headers,
      timeout: 10000,
    });

    const version = response.data?.version;
    if (!version) return "Unknown";

    return version;
  } catch (error) {
    console.error(`Failed to get ${branch} version:`, error);
    return "Unknown";
  }
}

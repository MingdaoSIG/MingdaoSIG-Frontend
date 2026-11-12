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

    const response = await fetch(apiUrl, {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`GitHub responded with ${response.status}`);
    }

    const data: { version?: string } = await response.json();
    const version = data?.version;
    if (!version) {
      return "Unknown";
    }

    return version;
  } catch (error) {
    console.error(`Failed to get ${branch} version:`, error);
    return "Unknown";
  }
}

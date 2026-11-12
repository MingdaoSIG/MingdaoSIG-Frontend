/**
 * Which dock / tab-bar item matches the current path: 0 home, 1 your own
 * profile, 2 new post, 3 info, -1 none. Other people's profiles and SIG
 * pages (also /@…) are not "You".
 */
export function selectedTab(path: string, ownCustomId?: string | null) {
  let decoded = path;
  try {
    decoded = decodeURIComponent(path);
  } catch {
    // keep the raw path
  }
  if (decoded === "/") {
    return 0;
  }
  if (ownCustomId && decoded === `/@${ownCustomId}`) {
    return 1;
  }
  if (decoded === "/new") {
    return 2;
  }
  if (decoded === "/info") {
    return 3;
  }
  return -1;
}

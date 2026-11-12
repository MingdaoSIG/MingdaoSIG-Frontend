import { notFound } from "next/navigation";
// Validation
import { isValidCustomId, sanitizeUrlParam } from "@/modules/validation";
import UserPage from "./(User)/UserPage";

// Validated on the server so a malformed id answers 404 even though the
// client shell renders nothing until it knows the screen size.
export default async function Page({
  params,
}: {
  params: Promise<{ userID: string }>;
}) {
  const { userID } = await params;

  let rawUserID = "";
  try {
    rawUserID = decodeURIComponent(userID);
  } catch {
    notFound();
  }

  // 驗證 userID 格式
  if (!isValidCustomId(rawUserID)) {
    notFound();
  }

  // 清理 userID（防止路徑遍歷）
  return <UserPage accountId={sanitizeUrlParam(rawUserID)} />;
}

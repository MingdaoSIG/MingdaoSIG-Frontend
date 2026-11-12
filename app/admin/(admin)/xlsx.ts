"use client";

import type { TEventRsvp } from "@/interfaces/Engagement";
import type { SigMember } from "./types";

// Excel downloads. The xlsx package is large, so it loads only when a
// download starts.

function today() {
  return new Date().toISOString().split("T")[0];
}

/** Characters Windows and macOS refuse in file names. */
function safeName(name: string) {
  return name.replace(/[\\/:*?"<>|]/g, "_").trim() || "SIG";
}

export async function downloadMembers(sigName: string, members: SigMember[]) {
  const XLSX = await import("xlsx");
  const rows = members.map((m) => ({
    學號: m.code ?? "",
    姓名: m.name ?? "",
    Email: m.email ?? "",
    班級: m.class ?? "",
  }));
  const sheet = XLSX.utils.json_to_sheet(rows, {
    header: ["學號", "姓名", "Email", "班級"],
  });
  sheet["!cols"] = [{ wch: 15 }, { wch: 15 }, { wch: 30 }, { wch: 10 }];
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "成員名單");
  XLSX.writeFile(book, `${safeName(sigName)}_成員名單_${today()}.xlsx`);
}

export type PostExportRow = {
  _id: string;
  title: string;
  sigName: string;
  author: string;
  createdAt?: string;
};

export async function downloadPosts(
  start: string,
  end: string,
  posts: PostExportRow[],
) {
  const XLSX = await import("xlsx");
  const rows = posts.map((post) => ({
    ID: post._id,
    標題: post.title,
    SIG: post.sigName,
    發文日期: post.createdAt
      ? new Date(post.createdAt).toLocaleString("zh-TW")
      : "",
    發文者: post.author,
  }));
  const sheet = XLSX.utils.json_to_sheet(rows, {
    header: ["ID", "標題", "SIG", "發文日期", "發文者"],
  });
  sheet["!cols"] = [
    { wch: 26 },
    { wch: 40 },
    { wch: 16 },
    { wch: 22 },
    { wch: 14 },
  ];
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "貼文紀錄");
  XLSX.writeFile(book, `貼文紀錄 (${start} ~ ${end}).xlsx`);
}

/** Everyone who RSVPed to an event, oldest first. */
export async function downloadRsvps(
  sigName: string,
  event: { title: string; startAt: string },
  rsvps: TEventRsvp[],
) {
  const XLSX = await import("xlsx");
  const rows = rsvps.map((rsvp, index) => ({
    序號: index + 1,
    姓名: rsvp.user.name ?? "",
    班級: rsvp.user.class ?? "",
    帳號: rsvp.user.customId ? `@${rsvp.user.customId}` : "",
    報名時間: rsvp.createdAt
      ? new Date(rsvp.createdAt).toLocaleString("zh-TW", { hour12: false })
      : "",
  }));
  const header = ["序號", "姓名", "班級", "帳號", "報名時間"];
  const sheet = XLSX.utils.json_to_sheet(rows, { header });
  sheet["!cols"] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 10 },
    { wch: 18 },
    { wch: 22 },
  ];
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "報名名單");
  const start = new Date(event.startAt);
  const pad = (n: number) => String(n).padStart(2, "0");
  // The event's day in local time (the ISO date is UTC).
  const date = Number.isNaN(start.getTime())
    ? today()
    : `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`;
  XLSX.writeFile(
    book,
    `${safeName(sigName)}_${safeName(event.title)}_${date}_報名名單.xlsx`,
  );
}

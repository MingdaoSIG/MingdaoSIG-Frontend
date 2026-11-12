import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SITE_TITLE_SUFFIX } from "@/modules/site";
import { isValidObjectId } from "@/modules/validation";

import SeriesPage from "./SeriesPage";

type Props = { params: Promise<{ id: string }> };

export const metadata: Metadata = {
  title: `系列${SITE_TITLE_SUFFIX}`,
  description: "MDSIG 上的系列文章",
};

/** /series/[id]: one author's ordered posts (contract v4 §4.4). */
export default async function Page({ params }: Props) {
  const { id } = await params;
  if (!isValidObjectId(id)) {
    notFound();
  }
  return <SeriesPage id={id} />;
}

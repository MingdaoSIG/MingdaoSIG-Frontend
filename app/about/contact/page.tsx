import type { Metadata } from "next";
import { SITE_TITLE_SUFFIX } from "@/modules/site";
import { HelpCard, HelpPage } from "../HelpPage";
import { LinkGroup } from "../sections";

export const metadata: Metadata = {
  title: `聯絡與加入我們${SITE_TITLE_SUFFIX}`,
  description: "聯絡 MDSIG 開發團隊，或加入我們。",
};

export default function ContactPage() {
  return (
    <HelpPage
      title="聯絡與加入我們"
      description="MDSIG 由明道中學的學生開發與維護。"
    >
      <HelpCard title="聯絡我們" id="contact-us">
        <LinkGroup name="聯絡我們" />
      </HelpCard>
      <HelpCard title="加入開發團隊" id="join-team">
        <p className="mb-3 text-[0.9375rem] text-ink-700 leading-[1.75]">
          喜歡寫程式、設計或想幫忙經營平台？填寫報名表，我們會跟你聯絡。
        </p>
        <a
          href="https://forms.gle/ADMk67dcTURxjn979"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 items-center rounded-control bg-brand-700 px-5 font-semibold text-sm text-white transition-colors hover:bg-brand-800"
        >
          填寫加入開發團隊表單
        </a>
      </HelpCard>
      <HelpCard title="小小彩蛋" id="easter-eggs">
        <LinkGroup name="小小彩蛋" />
      </HelpCard>
    </HelpPage>
  );
}

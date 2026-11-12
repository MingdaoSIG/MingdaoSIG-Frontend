"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { apiRequest } from "@/modules/api/client";
import {
  bannerIsLive,
  dismissBanner,
  dismissedBanners,
  readBanner,
  type SiteBannerData,
} from "@/modules/siteBanner";
import { BannerBar } from "./BannerBar";

// The site banner (公告橫幅, contract v4 §5.4): the banner the backend
// picks for now, under the header. Closing it hides that banner in this
// browser for good (by id); a new banner shows again.

export const SITE_BANNER_QUERY_KEY = ["site-banner"] as const;

export function useSiteBanner() {
  return useQuery<SiteBannerData | null>({
    queryKey: SITE_BANNER_QUERY_KEY,
    queryFn: async ({ signal }) => {
      const result = await apiRequest<unknown>("/site/banner", { signal });
      // A failure only means no banner: it is never worth an error.
      return result.ok ? readBanner(result.data) : null;
    },
    // The backend caches it for 60 s.
    staleTime: 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    retry: false,
  });
}

/** Re-renders every `ms` while `active`, so a banner ends on time. */
function useNow(active: boolean, ms: number = 30 * 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) {
      return;
    }
    const timer = window.setInterval(() => setNow(Date.now()), ms);
    return () => window.clearInterval(timer);
  }, [active, ms]);
  return now;
}

export function SiteBanner({ layout = "page" }: { layout?: "page" }) {
  const banner = useSiteBanner().data ?? null;
  const [dismissed, setDismissed] = useState<string[]>(() =>
    dismissedBanners(),
  );
  const now = useNow(Boolean(banner));

  if (!banner || dismissed.includes(banner._id) || !bannerIsLive(banner, now)) {
    return null;
  }

  return (
    <BannerBar
      tone={banner.level}
      link={banner.link}
      layout={layout}
      onDismiss={() => {
        dismissBanner(banner._id);
        setDismissed((ids) => [...ids, banner._id]);
      }}
    >
      {banner.message}
    </BannerBar>
  );
}

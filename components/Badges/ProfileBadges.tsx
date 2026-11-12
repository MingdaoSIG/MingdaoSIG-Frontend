"use client";

import Image from "next/image";
import { Fragment } from "react";
import { Tooltip } from "react-tooltip";
import { badgeIconUrl, useBadges } from "@/modules/badges";

/**
 * The badges on a profile, from `GET /badge/list` (contract v4 §5.9), in
 * key order like before. A key the list does not know is skipped; while
 * the list cannot be read, the old config fills in the original three.
 * Retired badges stay on the profiles that have them.
 */
export function ProfileBadges({
  keys,
  className,
  badgeClassName,
}: {
  keys: string[] | undefined;
  className?: string;
  badgeClassName?: string;
}) {
  const { byKey } = useBadges();
  const shown = Array.from(new Set(keys ?? []))
    .sort()
    .map((key) => byKey.get(key))
    .filter((badge) => badge !== undefined);
  if (shown.length === 0) {
    return null;
  }
  return (
    <div className={className}>
      {shown.map((badge) => {
        const icon = badgeIconUrl(badge);
        const tooltipId = `badge-${badge.key}`;
        const tip = badge.description
          ? `${badge.name}：${badge.description}`
          : badge.name;
        return (
          <Fragment key={badge.key}>
            {icon ? (
              <Image
                src={icon}
                height={24}
                width={24}
                unoptimized
                alt={badge.name}
                className={badgeClassName}
                data-tooltip-id={tooltipId}
                data-tooltip-content={tip}
                data-tooltip-place="top"
              />
            ) : (
              <span
                role="img"
                aria-label={badge.name}
                className={`${badgeClassName ?? ""} inline-flex size-6 items-center justify-center rounded-full font-bold text-[11px] text-white`}
                style={{ backgroundColor: badge.color || "#0b5a83" }}
                data-tooltip-id={tooltipId}
                data-tooltip-content={tip}
                data-tooltip-place="top"
              >
                {Array.from(badge.name)[0]}
              </span>
            )}
            <Tooltip
              id={tooltipId}
              style={{
                padding: "0.2rem 0.4rem",
                backgroundColor: "rgb(50, 50, 50)",
              }}
            />
          </Fragment>
        );
      })}
    </div>
  );
}

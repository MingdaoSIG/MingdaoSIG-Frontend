"use client";

import Linkify from "@/components/Linkify/Linkify";
import { jumpOut } from "@/utils/jumpOut";

/**
 * Plain text whose URLs (and bare domains such as github.com) become links,
 * as in comments. A real <a> (so middle-click and "copy link" work), but a
 * normal click goes through jumpOut's 「即將離開」 confirmation.
 */
export function LinkText({ text }: { text: string }) {
  return (
    <Linkify
      componentDecorator={(href, label, key) => (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer nofollow ugc"
          className="break-all text-brand-700 underline decoration-brand-700/30 underline-offset-2 hover:decoration-current"
          onClick={(event) => {
            if (event.button !== 0 || event.metaKey || event.ctrlKey) {
              return;
            }
            event.preventDefault();
            jumpOut(href);
          }}
        >
          {label}
        </a>
      )}
    >
      {text}
    </Linkify>
  );
}

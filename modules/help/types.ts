import type { AdminRole } from "@/utils/useAdminAccess";

// The help centre's content model. Every text lives once, in the typed
// modules next to this file, and is rendered by /about (user help), the
// admin page /admin/help and the admin 「？說明」 drawer.
//
// Text fields are plain strings with two marks only (`HelpText`):
// `**bold**` and `[label](/path)` links. Labels of real buttons are
// written in 「」 exactly as the UI shows them.

/** A screenshot under public/help/ (WebP), with its intrinsic size. */
export type HelpImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export type HelpStep = {
  text: string;
  image?: HelpImage;
  /** Admin guides: the step applies only to these roles. */
  roles?: AdminRole[];
};

export type TourId = "post" | "join" | "event";

export type GuideAudience = "everyone" | "managers";

/** A tutorial at /about/guide/[topic]. */
export type GuideTopic = {
  id: string;
  title: string;
  audience: GuideAudience;
  /** One line, under the title and in the topic list. */
  summary: string;
  /** About how long it takes, in minutes. */
  minutes: number;
  steps: HelpStep[];
  tips?: string[];
  tour?: TourId;
  /** FAQ ids (modules/help/faq.ts) shown under the steps. */
  faq?: string[];
};

export type FaqItem = {
  /** The anchor is `#q-<id>`. */
  id: string;
  q: string;
  /** Paragraphs. */
  a: string[];
};

export type FaqGroup = { id: string; title: string; items: FaqItem[] };

/** A feature guide on /admin/help (anchor `#<id>`). */
export type AdminGuide = {
  id: string;
  title: string;
  /** Who can use the feature. */
  roles: AdminRole[];
  summary: string;
  /** Where the feature lives, for the 「前往」 link. */
  href?: string;
  steps: HelpStep[];
  /** How many steps the drawer shows (the short version). */
  short?: number;
  notes?: string[];
  /** Admin FAQ ids (modules/help/adminFaq.ts). */
  faq?: string[];
};

export type AdminFaqItem = FaqItem & { roles: AdminRole[] };

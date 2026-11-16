import type { ReactNode } from "react";
import { HelpShell } from "./HelpShell";

// Every /about page shares the help centre's frame (table of contents,
// search, report strip), which stays mounted between them.
export default function AboutLayout({ children }: { children: ReactNode }) {
  return <HelpShell>{children}</HelpShell>;
}

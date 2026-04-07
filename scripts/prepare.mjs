import { existsSync, copyFileSync } from "fs";
import { execFileSync } from "child_process";

execFileSync("git", ["config", "core.hooksPath", ".githooks"]);

if (!existsSync(".env.local")) {
  copyFileSync(".env.local.example", ".env.local");
  console.info(
    "\x1b[33m⚠ [prepare] Created .env.local from .env.local.example — \x1b[1mplease fill in your environment variables.\x1b[0m",
  );
} else {
  console.info(
    "\x1b[36mℹ [prepare] .env.local exists — remember to keep it up to date with .env.local.example.\x1b[0m",
  );
}

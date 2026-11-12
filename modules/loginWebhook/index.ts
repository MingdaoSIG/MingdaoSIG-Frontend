import type { User } from "@/interfaces/User";

// Login notice for the team's Discord channel. Server-side only: called
// from the next-auth sign-in callback, never exposed as a route (the old
// public /api/webhook/login forwarded anything anyone posted, including
// emails and student numbers). Only public profile fields are sent.

const BADGE_EMOJI: Record<string, string> = {
  developer: "<:developer:1222933983164235876>",
  "10.21_user": "<:1021user:1222933998913851442>",
  bug_hunter: "<:bughunter:1245079303000031282>",
};

/** Discord rejects empty embed field values. */
function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value : "—";
}

/**
 * The Discord URL is a credential. WEBHOOK_LOGIN is server-only; the old
 * NEXT_PUBLIC_ name still works until the deploy has moved the value.
 * Only read here, on the server, so neither ends up in a client bundle.
 */
function webhookUrl() {
  return (
    process.env.WEBHOOK_LOGIN || process.env.NEXT_PUBLIC_WEBHOOK_LOGIN || null
  );
}

export async function sendLoginWebhook(user: User): Promise<void> {
  const url = webhookUrl();
  if (!url) {
    return;
  }

  const badges = (Array.isArray(user.badge) ? user.badge : [])
    .map((badge) => BADGE_EMOJI[badge])
    .filter(Boolean)
    .join(" ");

  const content = {
    username: "MDSIG Login",
    avatar_url: "https://sig.mingdao.edu.tw/images/sig2pfp.png",
    embeds: [
      {
        title: text(user.name),
        color: 0x34e718,
        thumbnail: user.avatar ? { url: user.avatar } : undefined,
        fields: [
          { name: "ID", value: text(user._id), inline: true },
          { name: "Custom ID", value: text(user.customId), inline: true },
          { name: "Identity", value: text(user.identity), inline: true },
          { name: "Badge", value: badges || "No Badge", inline: true },
        ],
        timestamp: new Date().toISOString(),
        footer: {
          text: "MDSIG 2.0 Login System",
          icon_url: "https://sig.mingdao.edu.tw/images/sig2pfp.png",
        },
      },
    ],
  };

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(content),
      signal: AbortSignal.timeout(5000),
    });
  } catch (error) {
    console.error(
      "Failed to send login webhook:",
      error instanceof Error ? error.message : error,
    );
  }
}

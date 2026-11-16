// The two marks of help text: `**bold**` and `[label](href)`.
export const HELP_TOKEN = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;

/** The text without its marks (search, previews). */
export function plainHelpText(text: string) {
  return text.replace(
    HELP_TOKEN,
    (_all, bold: string | undefined, label: string | undefined) =>
      bold ?? label ?? "",
  );
}

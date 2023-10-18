export default function MarkdownToPlainText(markdown: string) {
  // Remove headings
  markdown = markdown.replace(/#+\s+(.*)/g, "$1");

  // Remove bold and italic formatting
  markdown = markdown.replace(/(\*\*|__)(.*?)\1/g, "$2");
  markdown = markdown.replace(/(\*|_)(.*?)\1/g, "$2");

  // Remove inline code formatting
  markdown = markdown.replace(/`([^`]+)`/g, "$1");

  // Remove images
  markdown = markdown.replace(/!\[(.*?)\]\(.*?\)/g, "$1");

  // Remove links
  markdown = markdown.replace(/\[(.*?)\]\(.*?\)/g, "$1");

  // Remove blockquotes
  markdown = markdown.replace(/^\s*>.*$/gm, "");

  // Remove unordered lists
  markdown = markdown.replace(/^\s*-\s+(.*)$/gm, "$1");

  // Remove ordered lists
  markdown = markdown.replace(/^\s*\d+\.\s+(.*)$/gm, "$1");

  // Remove horizontal rules
  markdown = markdown.replace(/^\s*[-*_]{3,}\s*$/gm, "");

  // Remove code blocks
  markdown = markdown.replace(/```[\s\S]*?```/g, "");

  // Remove tables
  markdown = markdown.replace(/(\|.*\|.*\|\n\|.*\|.*\|\n)(\|.*\|.*\|\n)+/g, "");

  // Remove inline LaTeX expressions
  markdown = markdown.replace(/\\\((.*?)\\\)/g, "");

  // Remove formulas
  markdown = markdown.replace(/\$\$\n[\s\S]*?\n\$\$/g, "");
  markdown = markdown.replace(/\$[\S ]*?\$/g, "");

  // Remove horizontal rules
  markdown = markdown.replace(/^\s*[-*_]{3,}\s*$/gm, "");

  // Remove line breaks
  markdown = markdown.replace(/\n/g, " ");

  // Trim leading and trailing whitespace
  markdown = markdown.trim();

  return markdown;
}

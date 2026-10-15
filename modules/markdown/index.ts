/*
 * Markdown → sanitised HTML for MDSIG posts.
 *
 * One pipeline for the post page and the editor preview, so what authors
 * see while writing is exactly what readers get. Runs in the browser and
 * in Node (ready for server rendering later).
 *
 * Compatibility with the previous renderer (md-editor-rt / markdown-it,
 * `html: true, breaks: true, linkify: true`):
 *   - single newlines are line breaks            → remark-breaks
 *   - bare URLs become links                      → remark-gfm autolinks
 *   - raw HTML (<u>, YouTube/Vimeo <iframe>)      → rehype-raw + sanitize
 *   - an image alone in a paragraph → <figure>; its *title* (not alt)
 *     becomes the <figcaption>, as markdown-it-image-figures did
 *   - tables, task lists, ~~strike~~              → remark-gfm
 *   - $inline$ / $$block$$ KaTeX                  → remark-math (+ lazy katex),
 *     with markdown-it-katex delimiter rules so prices like NT$300 stay text
 *   - fenced code highlighting                    → lazy rehype-highlight
 * Intentional differences:
 *   - `~text~` is NOT subscript (it mangled ranges like 「1~2 點」)
 *   - `^text^` superscript, `!!!` admonitions, mermaid/echarts blocks are
 *     not rendered (0–2 posts each in a 748-post sample)
 *
 * Output is sanitised (rehype-sanitize) before any trusted plugin runs.
 */

import type { Element, Root } from "hast";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, {
  defaultSchema,
  type Options as SanitizeSchema,
} from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { type PluggableList, unified } from "unified";
import { visit } from "unist-util-visit";
import { protectDollars } from "./dollars";

// ------------------------------------------------------------------ //
// Sanitising                                                          //
// ------------------------------------------------------------------ //

const IFRAME_HOSTS = new Set([
  "www.youtube.com",
  "youtube.com",
  "www.youtube-nocookie.com",
  "player.vimeo.com",
]);

const schema: SanitizeSchema = {
  ...defaultSchema,
  // GitHub's schema prefixes ids with "user-content-"; we render no ids
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    "u",
    "iframe",
    "figure",
    "figcaption",
    "mark",
  ],
  attributes: {
    ...defaultSchema.attributes,
    code: [["className", /^language-./, "math-inline", "math-display"]],
    iframe: [
      "src",
      "width",
      "height",
      "title",
      "allow",
      "allowFullScreen",
      "frameBorder",
    ],
  },
  protocols: {
    ...defaultSchema.protocols,
    src: ["http", "https"],
  },
};

/** Only keep embeds from known video hosts; harden the rest. */
function rehypeEmbeds() {
  return (tree: Root) => {
    visit(tree, "element", (node, index, parent) => {
      if (node.tagName !== "iframe" || !parent || index === undefined) {
        return;
      }
      let host = "";
      try {
        host = new URL(String(node.properties.src ?? "")).host;
      } catch {
        host = "";
      }
      if (!IFRAME_HOSTS.has(host)) {
        parent.children.splice(index, 1);
        return index;
      }
      node.properties = {
        src: node.properties.src,
        title: node.properties.title ?? "Embedded video",
        allow:
          "accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen",
        allowFullScreen: true,
        loading: "lazy",
        referrerPolicy: "strict-origin-when-cross-origin",
      };
    });
  };
}

// ------------------------------------------------------------------ //
// Presentation                                                        //
// ------------------------------------------------------------------ //

/**
 * `<p><img title="…"></p>` → `<figure><img><figcaption>…</figcaption></figure>`
 * Mirrors markdown-it-image-figures with `figcaption: true` (title only;
 * alt text is never shown as a caption).
 */
function rehypeFigures() {
  return (tree: Root) => {
    visit(tree, "element", (node, index, parent) => {
      if (node.tagName !== "p" || !parent || index === undefined) {
        return;
      }
      const meaningful = node.children.filter(
        (child) =>
          !(child.type === "text" && child.value.trim() === "") &&
          !(child.type === "element" && child.tagName === "br"),
      );
      const only = meaningful[0];
      if (
        meaningful.length !== 1 ||
        only.type !== "element" ||
        only.tagName !== "img"
      ) {
        return;
      }
      const title = String(only.properties.title ?? "").trim();
      const figure: Element = {
        type: "element",
        tagName: "figure",
        properties: {},
        children: [only],
      };
      if (title) {
        delete only.properties.title;
        figure.children.push({
          type: "element",
          tagName: "figcaption",
          properties: {},
          children: [{ type: "text", value: title }],
        });
      }
      parent.children[index] = figure;
    });
  };
}

function decodeUrlText(text: string) {
  try {
    return decodeURI(text);
  } catch {
    return text;
  }
}

/**
 * Lazy-load images; open external links in a new tab; show percent-encoded
 * autolinks readably (「…/wiki/青霉素」 rather than 「…/wiki/%E9%9D%92…」),
 * as markdown-it's linkify did.
 */
function rehypeAttributes() {
  return (tree: Root) => {
    visit(tree, "element", (node) => {
      if (node.tagName === "a" && node.children.length === 1) {
        const child = node.children[0];
        if (
          child.type === "text" &&
          child.value === node.properties.href &&
          child.value.includes("%")
        ) {
          child.value = decodeUrlText(child.value);
        }
      }
      if (node.tagName === "img") {
        node.properties.loading = "lazy";
        node.properties.decoding = "async";
      }
      if (node.tagName === "a") {
        const href = String(node.properties.href ?? "");
        if (/^https?:\/\//.test(href)) {
          node.properties.target = "_blank";
          node.properties.rel = ["noopener", "noreferrer", "nofollow"];
        }
      }
    });
  };
}

// ------------------------------------------------------------------ //
// Pipeline                                                            //
// ------------------------------------------------------------------ //

const HAS_MATH = /\$[^$\n]+\$|\$\$/;
const HAS_CODE_FENCE = /^\s*(```|~~~)/m;

export async function renderMarkdown(markdown: string): Promise<string> {
  // U+FEFF (BOM / zero-width no-break space) pasted from Word & co. blocks
  // emphasis in micromark (`**\ufeff二、…**`); it is invisible anyway.
  const source = protectDollars((markdown ?? "").replace(/\ufeff/g, ""));

  // Heavy plugins are only loaded when a post needs them
  const trusted: PluggableList = [];
  if (HAS_MATH.test(source)) {
    const { default: rehypeKatex } = await import("rehype-katex");
    trusted.push([rehypeKatex, { throwOnError: false, strict: false }]);
  }
  if (HAS_CODE_FENCE.test(source)) {
    const { default: rehypeHighlight } = await import("rehype-highlight");
    trusted.push([rehypeHighlight, { detect: false }]);
  }

  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm, { singleTilde: false })
    .use(remarkMath)
    .use(remarkBreaks)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSanitize, schema)
    .use(rehypeEmbeds)
    .use(rehypeFigures)
    .use(rehypeAttributes)
    .use(trusted)
    .use(rehypeStringify)
    .process(source);

  return String(file);
}

export const needsKatexStyles = (markdown: string) =>
  HAS_MATH.test(markdown ?? "");

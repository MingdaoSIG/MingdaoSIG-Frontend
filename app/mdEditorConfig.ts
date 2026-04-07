"use client";

import { config } from "md-editor-rt";

config({
  editorConfig: {
    languageUserDefined: {
      "en-US": {
        toolbarTips: {
          bold: "bold",
          underline: "underline",
          italic: "italic",
          strikeThrough: "strikeThrough",
          title: "title",
          sub: "subscript",
          sup: "superscript",
          quote: "quote",
          unorderedList: "unordered list",
          orderedList: "ordered list",
          codeRow: "inline code",
          code: "block-level code",
          link: "link",
          image: "image",
          table: "table",
          mermaid: "mermaid",
          katex: "formula",
          revoke: "revoke",
          next: "undo revoke",
          save: "save",
          prettier: "prettier",
          pageFullscreen: "fullscreen in page",
          fullscreen: "fullscreen",
          preview: "preview",
          previewOnly: "previewOnly",
          htmlPreview: "html preview",
          catalog: "catalog",
          github: "source code",
        },
        titleItem: {
          h1: "Lv1 Heading",
          h2: "Lv2 Heading",
          h3: "Lv3 Heading",
          h4: "Lv4 Heading",
          h5: "Lv5 Heading",
          h6: "Lv6 Heading",
        },
        imgTitleItem: {
          link: "Add Img Link",
          upload: "Upload Img",
          clip2upload: "Clip Upload",
        },
        linkModalTips: {
          linkTitle: "Add Link",
          imageTitle: "Add Image",
          descLabel: "Desc:",
          descLabelPlaceHolder: "Enter a description...",
          urlLabel: "Link:",
          urlLabelPlaceHolder: "Enter a link...",
          buttonOK: "OK",
        },
        clipModalTips: {
          title: "Crop Image",
          buttonUpload: "Upload",
        },
        copyCode: {
          text: "Copy",
          successTips: "Copied!",
          failTips: "Copy failed!",
        },
        mermaid: {
          flow: "flow",
          sequence: "sequence",
          gantt: "gantt",
          class: "class",
          state: "state",
          pie: "pie",
          relationship: "relationship",
          journey: "journey",
        },
        katex: {
          inline: "inline",
          block: "block",
        },
        footer: {
          markdownTotal: "Word Count",
          scrollAuto: "Scroll Auto",
        },
      },
    },
  },
});

import { LinkifyIt } from "linkify-it";
import { cloneElement, isValidElement, type ReactNode } from "react";
import tlds from "tlds";

/**
 * Drop-in replacement for `react-linkify`, which is unmaintained and pins a
 * vulnerable `linkify-it@2`. Same matcher setup (linkify-it + full TLD list)
 * and same `componentDecorator` contract, so call sites only swap the import.
 */

export type LinkifyComponentDecorator = (
  decoratedHref: string,
  decoratedText: string,
  key: number,
) => ReactNode;

interface LinkifyProps {
  children?: ReactNode;
  componentDecorator: LinkifyComponentDecorator;
}

// linkify-it >=6 defaults `fuzzyLink` to false; react-linkify relied on the
// old default (true), so bare domains like `github.com` keep being linked.
const linkify = new LinkifyIt({ fuzzyLink: true }).tlds(tlds);

function parseString(
  text: string,
  decorate: LinkifyComponentDecorator,
): ReactNode {
  if (text === "") {
    return text;
  }

  const matches = linkify.match(text);
  if (!matches) {
    return text;
  }

  const elements: ReactNode[] = [];
  let lastIndex = 0;
  let i = 0;

  for (const match of matches) {
    if (match.index > lastIndex) {
      elements.push(text.substring(lastIndex, match.index));
    }
    elements.push(decorate(match.url, match.text, i));
    lastIndex = match.lastIndex;
    i++;
  }

  if (text.length > lastIndex) {
    elements.push(text.substring(lastIndex));
  }

  return elements.length === 1 ? elements[0] : elements;
}

function parse(
  children: ReactNode,
  decorate: LinkifyComponentDecorator,
  key: number = 0,
): ReactNode {
  if (typeof children === "string") {
    return parseString(children, decorate);
  }

  if (Array.isArray(children)) {
    return children.map((child, i) => parse(child, decorate, i));
  }

  // Recurse into elements, but never linkify inside existing links/buttons
  if (
    isValidElement<{ children?: ReactNode }>(children) &&
    children.type !== "a" &&
    children.type !== "button"
  ) {
    return cloneElement(
      children,
      { key: children.key ?? key },
      parse(children.props.children, decorate),
    );
  }

  return children;
}

export default function Linkify({
  children,
  componentDecorator,
}: LinkifyProps) {
  return <>{parse(children, componentDecorator)}</>;
}

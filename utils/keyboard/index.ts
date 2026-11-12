type KeyLike = {
  key: string;
  keyCode?: number;
  shiftKey?: boolean;
  isComposing?: boolean;
  nativeEvent?: { isComposing?: boolean };
};

/**
 * True for an Enter press meant to submit. An Enter that picks a candidate
 * in an input method (注音, 拼音, Japanese…) is not: browsers flag it with
 * isComposing, and Safari with keyCode 229.
 */
export function isSubmitEnter(event: KeyLike, allowShift: boolean = false) {
  if (event.key !== "Enter") {
    return false;
  }
  if (
    event.isComposing ||
    event.nativeEvent?.isComposing ||
    event.keyCode === 229
  ) {
    return false;
  }
  return allowShift || !event.shiftKey;
}

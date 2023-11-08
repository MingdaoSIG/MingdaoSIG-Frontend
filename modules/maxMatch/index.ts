import word_list from "./word_list";

export default function maxMatch(sentence: string): string[] {
  const arr: string[] = [];
  for (let i = 0; i <= sentence.length; i++) {
    for (let j = sentence.length; j >= 0; j--) {
      if (word_list.has(sentence.slice(i, j))) {
        arr.push(sentence.slice(i, j));
        sentence = sentence.replace(sentence.slice(i, j), "*");
        i = -1;
        break;
      }
    }
  }
  let i = 0;
  return sentence.split("").map((v) => (v === "*" ? arr[i++] : v));
}
export function relativeTime(input: Date | string | number): string {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const ageMs = Date.now() - date.getTime();
  const ageSec = Math.floor(ageMs / 1000);
  if (ageSec < 60) {
    return "剛剛";
  }
  const ageMin = Math.floor(ageSec / 60);
  if (ageMin < 60) {
    return `${ageMin} 分鐘前`;
  }
  const ageHr = Math.floor(ageMin / 60);
  if (ageHr < 24) {
    return `${ageHr} 小時前`;
  }
  const ageDay = Math.floor(ageHr / 24);
  if (ageDay < 7) {
    return `${ageDay} 天前`;
  }
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
}

export default relativeTime;

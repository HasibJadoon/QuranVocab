export function buildDuration(value: number): string {
  if (value == null) {
    return '';
  }
  const m = Math.ceil(value / 60);
  const hour = Math.floor(m / 60);
  const min = m - hour * 60;
  return (hour < 10 ? '0' : '') + hour + ':' + (min < 10 ? '0' : '') + min;
}

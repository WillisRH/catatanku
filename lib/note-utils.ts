export function calcReadingTime(text: string | undefined | null): number {
  if (!text) return 0;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.ceil(words / 200);
}

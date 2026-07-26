export type Interval = { start: Date; end: Date };
export type SlotOptions = { durationMinutes: number; bufferBeforeMinutes: number; bufferAfterMinutes: number; minimumNoticeMinutes: number; now?: Date; incrementMinutes?: number };

export function overlaps(a: Interval, b: Interval) { return a.start < b.end && b.start < a.end; }

/** Produces slots from already-UTC availability intervals. Time-zone conversion stays at the boundary. */
export function generateSlots(windows: Interval[], busy: Interval[], options: SlotOptions): Interval[] {
  const now = options.now ?? new Date();
  const increment = options.incrementMinutes ?? 30;
  const duration = options.durationMinutes * 60_000;
  const before = options.bufferBeforeMinutes * 60_000;
  const after = options.bufferAfterMinutes * 60_000;
  const earliest = new Date(now.getTime() + options.minimumNoticeMinutes * 60_000);
  return windows.flatMap(window => {
    const output: Interval[] = [];
    for (let current = window.start.getTime(); current + duration <= window.end.getTime(); current += increment * 60_000) {
      const candidate = { start: new Date(current), end: new Date(current + duration) };
      const protectedCandidate = { start: new Date(current - before), end: new Date(current + duration + after) };
      if (candidate.start >= earliest && !busy.some(interval => overlaps(protectedCandidate, interval))) output.push(candidate);
    }
    return output;
  });
}

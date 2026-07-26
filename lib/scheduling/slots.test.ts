import { describe, expect, it } from "vitest";
import { generateSlots } from "./slots";

const at = (value: string) => new Date(`2026-07-20T${value}:00.000Z`);
describe("generateSlots", () => {
  it("honours minimum notice, duration and buffers around busy times", () => {
    const slots = generateSlots([{ start: at("09:00"), end: at("12:00") }], [{ start: at("10:00"), end: at("10:30") }], { durationMinutes: 30, bufferBeforeMinutes: 15, bufferAfterMinutes: 15, minimumNoticeMinutes: 60, now: at("08:15") });
    expect(slots.map(slot => slot.start.toISOString().slice(11, 16))).toEqual(["11:00", "11:30"]);
  });
});

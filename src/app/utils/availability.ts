export const isOverlapping = (
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
) => {
  return aStart < bEnd && bStart < aEnd;
};

export const validateAvailability = (
  availability: { day: string; startTime: string; endTime: string }[],
) => {
  const seen = new Set();

  for (let i = 0; i < availability.length; i++) {
    const a = availability[i];

    // ✅ 1. Invalid range check
    if (a.startTime >= a.endTime) {
      throw new Error(`Invalid time range on ${a.day}`);
    }

    // ✅ 2. Duplicate check (your code — integrated here)
    const key = `${a.day}-${a.startTime}-${a.endTime}`;
    if (seen.has(key)) {
      throw new Error(`Duplicate slot found: ${key}`);
    }
    seen.add(key);

    // ✅ 3. Overlap check
    for (let j = i + 1; j < availability.length; j++) {
      const b = availability[j];

      if (a.day !== b.day) continue;

      if (isOverlapping(a.startTime, a.endTime, b.startTime, b.endTime)) {
        throw new Error(
          `Overlapping slots on ${a.day}: ${a.startTime}-${a.endTime} & ${b.startTime}-${b.endTime}`,
        );
      }
    }
  }
};

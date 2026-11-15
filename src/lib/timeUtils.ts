/**
 * Utility functions for formatting and parsing doctor availability time slots.
 * Ensures consistent 12-hour AM/PM display across all portals and pre-booking flows.
 */

export function formatTimeSlot(slot: string): string {
  if (!slot) return "";
  // If already contains AM or PM (case-insensitive), return as-is
  if (/am|pm/i.test(slot)) {
    return slot;
  }

  const formatSingle = (timeStr: string): string => {
    const trimmed = timeStr.trim();
    if (!trimmed) return "";
    const match = trimmed.match(/^(\d{1,2})(?::(\d{2}))?$/);
    if (!match) return trimmed;

    let hours = parseInt(match[1], 10);
    const minutes = match[2] !== undefined ? match[2] : "00";
    if (isNaN(hours)) return trimmed;

    const period = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    if (hours === 0) hours = 12;

    return `${hours}:${minutes} ${period}`;
  };

  if (slot.includes("-")) {
    const parts = slot.split("-");
    if (parts.length === 2) {
      const start = formatSingle(parts[0]);
      const end = formatSingle(parts[1]);
      if (start && end) {
        return `${start} - ${end}`;
      }
    }
  }

  return formatSingle(slot) || slot;
}

export function parseSlotTime(slot: string): { hours: number; minutes: number } {
  if (!slot) return { hours: 9, minutes: 0 };
  const firstPart = slot.split("-")[0].trim();
  const isPM = /pm/i.test(firstPart);
  const isAM = /am/i.test(firstPart);
  const clean = firstPart.replace(/[^\d:]/g, "");
  const [hStr, mStr] = clean.split(":");
  let hours = parseInt(hStr, 10) || 0;
  const minutes = parseInt(mStr, 10) || 0;

  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;

  return { hours, minutes };
}

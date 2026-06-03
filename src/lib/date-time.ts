const JAKARTA_TIME_ZONE = "Asia/Jakarta";
const JAKARTA_OFFSET_HOURS = 7;
const JAKARTA_OFFSET_MS = JAKARTA_OFFSET_HOURS * 60 * 60 * 1000;

function parseDateParts(value: string) {
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2}))?)?$/,
  );

  if (!match) {
    return null;
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4] ?? 0),
    minute: Number(match[5] ?? 0),
    second: Number(match[6] ?? 0),
  };
}

export function jakartaDatetimeLocalToIso(value: string) {
  const parts = parseDateParts(value);

  if (!parts) {
    return "";
  }

  return new Date(
    Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour - JAKARTA_OFFSET_HOURS,
      parts.minute,
      parts.second,
    ),
  ).toISOString();
}

export function jakartaDateRangeToUtcIso(value: string, boundary: "start" | "end") {
  const parts = parseDateParts(value);

  if (!parts) {
    return "";
  }

  const utcTime =
    boundary === "start"
      ? Date.UTC(parts.year, parts.month - 1, parts.day) - JAKARTA_OFFSET_MS
      : Date.UTC(parts.year, parts.month - 1, parts.day + 1) -
        JAKARTA_OFFSET_MS -
        1;

  return new Date(utcTime).toISOString();
}

export function isoToJakartaDatetimeLocal(value?: string | null) {
  if (!value) {
    return "";
  }

  return new Date(new Date(value).getTime() + JAKARTA_OFFSET_MS)
    .toISOString()
    .slice(0, 16);
}

export function formatJakartaDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: JAKARTA_TIME_ZONE,
  }).format(new Date(value));
}

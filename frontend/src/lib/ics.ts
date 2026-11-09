// Builds .ics calendar files so reminders land in Google/Apple/Outlook calendars.
type CalendarEvent = {
  title: string;
  description: string;
  start: Date;
  minutes: number;
  rrule?: string;
};

const pad = (n: number) => String(n).padStart(2, "0");
const stamp = (d: Date) =>
  `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
const escape = (text: string) => text.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/[,;]/g, (m) => `\\${m}`);

export function downloadCalendar(filename: string, events: CalendarEvent[]) {
  const now = new Date();
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Northstar//Money plan//EN", "CALSCALE:GREGORIAN"];
  events.forEach((event, i) => {
    const end = new Date(event.start.getTime() + event.minutes * 60000);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${now.getTime()}-${i}@northstar`,
      `DTSTAMP:${stamp(now)}`,
      `DTSTART:${stamp(event.start)}`,
      `DTEND:${stamp(end)}`,
      `SUMMARY:${escape(event.title)}`,
      `DESCRIPTION:${escape(event.description)}`,
      ...(event.rrule ? [`RRULE:${event.rrule}`] : []),
      "BEGIN:VALARM",
      "TRIGGER:-PT30M",
      "ACTION:DISPLAY",
      `DESCRIPTION:${escape(event.title)}`,
      "END:VALARM",
      "END:VEVENT",
    );
  });
  lines.push("END:VCALENDAR");

  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function paydayRule(frequency: string, first: Date) {
  switch (frequency) {
    case "weekly":
      return "FREQ=WEEKLY";
    case "biweekly":
      return "FREQ=WEEKLY;INTERVAL=2";
    case "monthly":
      return `FREQ=MONTHLY;BYMONTHDAY=${first.getDate()}`;
    default:
      return "FREQ=MONTHLY;BYMONTHDAY=15,-1";
  }
}

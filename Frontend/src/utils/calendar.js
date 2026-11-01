/**
 * Calendar Utilities for SkillSwap
 * Zero-dependency helpers for Google Calendar URL generation and .ics download.
 */

const formatToIsoClean = (date) => {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

/**
 * Generates an 'Add to Google Calendar' link.
 */
export const generateGoogleCalendarUrl = ({
  title,
  description = '',
  startTime,
  durationMinutes = 30,
  locationUrl = window.location.origin + '/messages'
}) => {
  const start = new Date(startTime);
  if (isNaN(start.getTime())) return '#';

  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

  const startIso = formatToIsoClean(start);
  const endIso = formatToIsoClean(end);

  const fullDescription = `${description}\n\nJoin SkillSwap Video Room: ${locationUrl}\n\nOrganized via SkillSwap Reciprocal Learning.`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title || 'SkillSwap 1-on-1 Session',
    dates: `${startIso}/${endIso}`,
    details: fullDescription,
    location: locationUrl
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

/**
 * Downloads a standard RFC 5545 iCalendar (.ics) file compatible with Apple Calendar, Outlook, and mobile calendars.
 */
export const downloadIcsFile = ({
  title,
  description = '',
  startTime,
  durationMinutes = 30,
  locationUrl = window.location.origin + '/messages',
  filename = 'skillswap-session.ics'
}) => {
  const start = new Date(startTime);
  if (isNaN(start.getTime())) return;

  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  const now = new Date();

  const startIso = formatToIsoClean(start);
  const endIso = formatToIsoClean(end);
  const nowIso = formatToIsoClean(now);
  const uid = `skillswap-${start.getTime()}-${Math.random().toString(36).substring(2, 9)}@skillswap.com`;

  const cleanDesc = (description + `\\n\\nJoin Video Call: ${locationUrl}`).replace(/\n/g, '\\n');

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SkillSwap//Skill Exchange Platform//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${nowIso}`,
    `DTSTART:${startIso}`,
    `DTEND:${endIso}`,
    `SUMMARY:${title || 'SkillSwap 1-on-1 Session'}`,
    `DESCRIPTION:${cleanDesc}`,
    `LOCATION:${locationUrl}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename.endsWith('.ics') ? filename : `${filename}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Formats a date in user's localized time.
 */
export const formatSessionDate = (dateInput) => {
  if (!dateInput) return 'Unscheduled';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return 'Unscheduled';

  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(date);
};

/**
 * Returns a human-friendly countdown to the session.
 */
export const getSessionCountdown = (dateInput, durationMinutes = 30) => {
  if (!dateInput) return null;
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return null;

  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / (60 * 1000));
  const diffHours = Math.round(diffMs / (60 * 60 * 1000));
  const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));

  // If in progress
  const endTime = new Date(date.getTime() + durationMinutes * 60 * 1000);
  if (now >= date && now <= endTime) {
    return { label: 'LIVE NOW', isLive: true, color: 'emerald' };
  }

  // If passed
  if (now > endTime) {
    return { label: 'Session Passed', isLive: false, color: 'gray' };
  }

  // Upcoming
  if (diffMins < 60) {
    return { label: `Starts in ${diffMins}m`, isLive: false, color: 'amber' };
  }
  if (diffHours < 24) {
    return { label: `In ${diffHours} hours`, isLive: false, color: 'blue' };
  }
  if (diffDays === 1) {
    return { label: 'Tomorrow', isLive: false, color: 'blue' };
  }
  return { label: `In ${diffDays} days`, isLive: false, color: 'blue' };
};

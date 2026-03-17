/** Format meters to km with 2 decimal places */
export function formatDistance(meters: number | null | undefined): string {
  if (meters == null || isNaN(meters)) return '--';
  return (meters / 1000).toFixed(2) + ' km';
}

/** Format seconds to h:mm:ss or mm:ss */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || isNaN(seconds)) return '--';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (h > 0) {
    return `${h}:${pad(m)}:${pad(s)}`;
  }
  return `${m}:${pad(s)}`;
}

/** Format m/s speed to min/km pace */
export function formatPace(metersPerSecond: number | null | undefined): string {
  if (metersPerSecond == null || isNaN(metersPerSecond) || metersPerSecond <= 0) return '--:--';
  const secondsPerKm = 1000 / metersPerSecond;
  const min = Math.floor(secondsPerKm / 60);
  const sec = Math.floor(secondsPerKm % 60);
  return `${min}:${sec.toString().padStart(2, '0')} /km`;
}

/** Format seconds to Xh YY sleep duration */
export function formatSleepDuration(seconds: number | null | undefined): string {
  if (seconds == null || seconds <= 0) return '--';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h${m.toString().padStart(2, '0')}`;
}

/** Format epoch ms to HH:mm local time */
export function formatTime(epochMs: number | null | undefined): string {
  if (epochMs == null || epochMs <= 0) return '--';
  const date = new Date(epochMs);
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

/** Format date string to readable format */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

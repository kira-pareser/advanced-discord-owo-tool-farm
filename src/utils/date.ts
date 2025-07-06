/**
 * Formats the duration between two timestamps into a human-readable string.
 *
 * The output format is: "{days}d {hh}:{mm}:{ss}", where:
 * - {days} is the number of full days,
 * - {hh} is the number of hours (zero-padded to 2 digits),
 * - {mm} is the number of minutes (zero-padded to 2 digits),
 * - {ss} is the number of seconds (zero-padded to 2 digits).
 *
 * @param startTimestamp - The start time in milliseconds since the Unix epoch.
 * @param endTimestamp - The end time in milliseconds since the Unix epoch.
 * @returns A formatted string representing the duration between the two timestamps.
 */
export const formatTime = (startTimestamp: number, endTimestamp: number): string => {
    const duration = endTimestamp - startTimestamp;
    const seconds = Math.floor((duration / 1000) % 60);
    const minutes = Math.floor((duration / (1000 * 60)) % 60);
    const hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
    const days = Math.floor(duration / (1000 * 60 * 60 * 24));

    const pad = (n: number) => String(n).padStart(2, "0");
    return `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

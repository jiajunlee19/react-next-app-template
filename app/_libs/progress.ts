export const MAX_PERCENT = 99;
const RANGE_LOW = 0.7;
const RANGE_HIGH = 1.4;

export function estimateDurationMs(taskIds: string[], taskMs: Record<string, number>, fallbackMs: number, baseMs = 0): number {
    return taskIds.reduce((total, id) => total + (taskMs[id] ?? fallbackMs), baseMs);
};

export function progressPercent(elapsedMs: number, estimateMs: number): number {
    if (!(estimateMs > 0)) {
        return elapsedMs > 0 ? MAX_PERCENT : 0;
    }

    if (elapsedMs <= 0) {
        return 0;
    }

    const tau = estimateMs / Math.LN10;
    const percent = MAX_PERCENT * (1- Math.exp(-elapsedMs / tau));

    return Math.min(MAX_PERCENT, Math.max(0, percent));
};

export function isOverdue(elapsedMs: number, estimateMs: number): boolean {
    if (!(estimateMs > 0)) {
        return false;
    }
    return elapsedMs > estimateMs * RANGE_HIGH;
};

export function formatDuration(ms: number): string {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
};

export function formatEstimateRange(estimateMs: number): string {
    const low = Math.max(1, Math.ceil((estimateMs * RANGE_LOW) / 60_000));
    const high = Math.max(1, Math.ceil((estimateMs * RANGE_HIGH) / 60_000));

    return low === high ? `~${low} min` : `${low}-${high} min`;
};
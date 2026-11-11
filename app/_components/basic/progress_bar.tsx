"use client"

import { twMerge } from "tailwind-merge"

type ProgressBarProps = {
    percent: number,
    label: string,
    sublabel?: string,
    tone?: 'default' | 'error',
    className?: string,
};

const TONE_FILL: Record<NonNullable<ProgressBarProps['tone']>, string> = {
    default: "bg-emerald-600 dark:bg-emerald-400",
    error: "bg-red-600 dark:bg-red-400",
};

export default function ProgressBar({ percent, label, sublabel, tone = 'default', className }: ProgressBarProps) {
    const clamped = Math.min(100, Math.max(0, Number.isFinite(percent) ? percent : 0));
    const rounded = Math.round(clamped);

    return (
        <div className={twMerge("w-full", className)}>
            <div className="flex justify-between text-sm mb-1">
                <span>{label}</span>
                <span>{rounded}</span>
            </div>
            <div
                role="progressbar"
                aria-valuenow={rounded}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuetext={`${label} - ${rounded}%`}
                className="h-2 w-full overflow-hidden rounded-xl border border-black/20 bg-gray-200 dark:border-white/30 dark:bg-gray-700"
            >
                <div className={twMerge("h-full rounded-xl transition-[width] duration-500 ease-linear", TONE_FILL[tone])} style={{ width: `${clamped}%` }} />
                {sublabel && (
                    <p className="text-sm mt-1" aria-live="polite">{sublabel}</p>
                )}
            </div>
        </div>
    );
};
'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

const isDev = process.env.NODE_ENV === "development"

export function trackEvent(event_name: string, path: string, duration_ms: number = 0) {
    if (isDev) return;

    const payload = { event_name, duration_ms };
    navigator.sendBeacon('/api/analytics', JSON.stringify(payload));
}

export function Analytics() {
    const pathname = usePathname();
    const lastPath = useRef<string | null>(null);
    const enteredAt = useRef<number>(Date.now());

    // Track page_exit on tab close / browser close / hard refresh
    useEffect(() => {
        if (isDev) return;

        const handleVisibiityChange = () => {
            if (document.visibilityState === 'hidden' && lastPath.current !== null) {
                const duration_ms = Date.now() - enteredAt.current;
                trackEvent('page_exit', lastPath.current, duration_ms)
            }
        };

        document.addEventListener('visibilitychange', handleVisibiityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibiityChange);
    }, []);

    // Track page_view and page_exit on client-side navigation
    useEffect(() => {
        if (isDev) return;
        
        if (pathname === lastPath.current) return;

        // Track item spent on previous page before navigating away
        if (lastPath.current !== null) {
            const duration_ms = Date.now() - enteredAt.current;
            trackEvent('page_exit', lastPath.current, duration_ms);
        }

        lastPath.current = pathname;
        enteredAt.current = Date.now();

        trackEvent('page_view', pathname);

    }, [pathname]);

    return null;
}
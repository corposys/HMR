import { useState, useEffect, useMemo } from 'react';
import { Clock } from 'lucide-react';

export default function CleaningTimer({ startedAt }) {
    const [elapsed, setElapsed] = useState(0);

    const startTime = useMemo(() => {
        if (!startedAt) return null;
        return new Date(startedAt).getTime();
    }, [startedAt]);

    useEffect(() => {
        if (!startTime) return;

        const update = () => {
            setElapsed(Date.now() - startTime);
        };

        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [startTime]);

    if (!startTime) return null;

    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    const isLong = minutes > 30;

    return (
        <div className={`flex items-center gap-1 text-[10px] font-mono ${isLong ? 'text-orange-400' : 'text-[var(--color-text-muted)]'}`}>
            <Clock className="w-2.5 h-2.5" />
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
    );
}

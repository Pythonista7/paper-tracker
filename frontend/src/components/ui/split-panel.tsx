import { useCallback, useRef, useState } from 'react';
import type { ReactNode } from 'react';

interface SplitPanelProps {
  initial?: number;
  min?: number;
  max?: number;
  id: string;
  left: ReactNode;
  right: ReactNode;
}

export function SplitPanel({ initial = 60, min = 35, max = 70, left, right }: SplitPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ratio, setRatio] = useState(initial);

  const startDrag = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      event.preventDefault();
      const startX = event.clientX;
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();

      const handleMove = (e: MouseEvent) => {
        const delta = e.clientX - startX;
        const percent = ((ratio / 100) * rect.width + delta) / rect.width;
        const clamped = Math.min(max / 100, Math.max(min / 100, percent));
        setRatio(clamped * 100);
      };

      const handleUp = () => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
      };

      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
    },
    [ratio, min, max]
  );

  return (
    <div ref={containerRef} className="flex h-full w-full">
      <div className="h-full" style={{ flexBasis: `${ratio}%` }}>
        {left}
      </div>
      <div
        className="mx-2 w-1 cursor-col-resize rounded-full bg-white/10"
        onMouseDown={startDrag}
        role="separator"
        aria-orientation="vertical"
      />
      <div className="h-full flex-1">{right}</div>
    </div>
  );
}

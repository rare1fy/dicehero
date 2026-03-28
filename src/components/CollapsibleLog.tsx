import React, { useState, useRef, useEffect } from 'react';

interface CollapsibleLogProps {
  logs: string[];
}

export const CollapsibleLog: React.FC<CollapsibleLogProps> = ({ logs }) => {
  const [expanded, setExpanded] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current && expanded) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs, expanded]);

  return (
    <div className="mt-auto">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-[8px] text-[var(--dungeon-text-dim)] hover:text-[var(--dungeon-text)] py-1 flex items-center justify-center gap-1 transition-colors"
      >
        <span className="tracking-[0.15em]">{expanded ? '▼ 收起日志' : '▲ 展开日志'}</span>
      </button>
      {expanded && (
        <div 
          ref={logRef}
          className="max-h-[120px] overflow-y-auto text-[8px] text-[var(--dungeon-text-dim)] space-y-0.5 px-3 pb-2 border-t border-[var(--dungeon-panel-border)] pt-1"
        >
          {logs.map((log, i) => (
            <div key={i} className="flex gap-1">
              <span className="text-[var(--dungeon-text-dim)] opacity-50">{'>>'}</span>
              <span>{log}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

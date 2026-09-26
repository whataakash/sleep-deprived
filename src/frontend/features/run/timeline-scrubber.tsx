'use client';

import React from 'react';
import { RunEvent } from '@/types/agent';
import { Play, Pause, SkipBack, SkipForward, Clock, History } from 'lucide-react';

interface TimelineScrubberProps {
  events: RunEvent[];
  currentEventIndex: number;
  onScrub: (index: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
}

export function TimelineScrubber({
  events,
  currentEventIndex,
  onScrub,
  isPlaying,
  onTogglePlay,
}: TimelineScrubberProps) {
  const currentEvent = events[currentEventIndex] || events[events.length - 1];

  return (
    <div className="w-full bg-[#111418] border-t border-[#232a32] px-4 py-3 flex flex-col gap-2 select-none z-10 font-mono text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-[#ea580c]" />
          <span className="font-semibold text-[var(--text-primary)]">
            Run #1042 Replay Scrubber
          </span>
          <span className="text-[11px] text-[var(--text-muted)]">
            Step {currentEventIndex + 1} of {events.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[var(--text-muted)]">Current State:</span>
          <span className="px-2 py-0.5 rounded bg-[#1c232c] border border-[#2b3644] text-[#f97316] font-bold">
            {currentEvent.title}
          </span>
        </div>

        {/* Play / Pause / Step Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onScrub(Math.max(0, currentEventIndex - 1))}
            disabled={currentEventIndex <= 0}
            className="p-1.5 rounded bg-[#181d24] hover:bg-[#222a34] text-[var(--text-secondary)] hover:text-white disabled:opacity-30 cursor-pointer"
            title="Previous Step"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onTogglePlay}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#ea580c] hover:bg-[#f97316] text-white font-semibold transition-colors cursor-pointer"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>PAUSE</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>REPLAY</span>
              </>
            )}
          </button>

          <button
            onClick={() => onScrub(Math.min(events.length - 1, currentEventIndex + 1))}
            disabled={currentEventIndex >= events.length - 1}
            className="p-1.5 rounded bg-[#181d24] hover:bg-[#222a34] text-[var(--text-secondary)] hover:text-white disabled:opacity-30 cursor-pointer"
            title="Next Step"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Slider Scrubber */}
      <div className="w-full flex items-center gap-3">
        <span className="text-[10px] text-[var(--text-muted)]">00:00</span>

        <input
          type="range"
          min={0}
          max={events.length - 1}
          value={currentEventIndex}
          onChange={(e) => onScrub(parseInt(e.target.value, 10))}
          className="flex-1 h-1.5 bg-[#1f262f] rounded-lg appearance-none cursor-pointer accent-[#ea580c]"
        />

        <span className="text-[10px] text-[var(--text-muted)]">00:36</span>
      </div>
    </div>
  );
}

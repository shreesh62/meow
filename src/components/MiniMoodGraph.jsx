import React, { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { moodScore, moodTone, toneColor } from '../lib/moodAnalytics';

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

const catmullRomToBezier = (points) => {
  if (points.length < 2) return '';
  const d = [];
  d.push(`M ${points[0].x} ${points[0].y}`);
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d.push(`C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`);
  }
  return d.join(' ');
};

const MiniMoodGraph = ({ points }) => {
  const [active, setActive] = useState(null);

  const dims = { w: 320, h: 92, padX: 10, padY: 12 };

  const prepared = useMemo(() => {
    const scores = points.map((p) => moodScore(p.label));
    const minS = 0;
    const maxS = 2;
    return points.map((p, idx) => {
      const x = dims.padX + (idx * (dims.w - dims.padX * 2)) / Math.max(1, points.length - 1);
      const s = scores[idx];
      const y = dims.padY + ((maxS - s) * (dims.h - dims.padY * 2)) / (maxS - minS);
      const tone = moodTone(p.label);
      return { ...p, x, y, tone };
    });
  }, [points]);

  const path = useMemo(() => catmullRomToBezier(prepared.map(({ x, y }) => ({ x, y }))), [prepared]);

  const activePoint = active != null ? prepared[active] : null;
  const activeFill = activePoint ? toneColor(activePoint.tone).fill : '#EFE7DD';
  const activeStroke = activePoint ? toneColor(activePoint.tone).stroke : '#8A7F73';

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${dims.w} ${dims.h}`} className="w-full h-[92px]">
        <path d={path} fill="none" stroke="#1F2937" strokeOpacity="0.18" strokeWidth="3" strokeLinecap="round" />
        <path d={path} fill="none" stroke={activeStroke} strokeOpacity="0.65" strokeWidth="3" strokeLinecap="round" />

        {prepared.map((p, idx) => {
          const isActive = idx === active;
          const tc = toneColor(p.tone);
          return (
            <g key={p.key}>
              <circle cx={p.x} cy={p.y} r={isActive ? 7 : 5} fill={tc.fill} stroke={tc.stroke} strokeWidth="2" />
              <text x={p.x} y={clamp(p.y - 10, 10, dims.h - 10)} textAnchor="middle" fontSize="10">
                {p.emoji}
              </text>
              <rect
                x={p.x - 14}
                y={p.y - 14}
                width="28"
                height="28"
                fill="transparent"
                onMouseEnter={() => setActive(idx)}
                onMouseLeave={() => setActive(null)}
                onClick={() => {
                  if (navigator?.vibrate) navigator.vibrate(8);
                  setActive((cur) => (cur === idx ? null : idx));
                }}
              />
            </g>
          );
        })}
      </svg>

      {activePoint && (
        <div
          className="absolute top-2 left-2 rounded-2xl bg-white/80 border border-white/60 shadow-sm backdrop-blur-xl px-3 py-2"
          style={{
            backgroundColor: activeFill,
          }}
        >
          <div className="text-xs font-extrabold text-gray-900">{activePoint.emoji} {activePoint.label}</div>
          <div className="text-[10px] font-semibold text-gray-700">
            {format(parseISO(activePoint.created_at), 'EEE, MMM d')}
          </div>
        </div>
      )}
    </div>
  );
};

export default MiniMoodGraph;


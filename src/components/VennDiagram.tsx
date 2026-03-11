import React, { useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SparklesIcon } from 'lucide-react';
import { Role, Activity, PRESET_COLORS } from '../types';
import {
  getRoleTimeLogged,
  getRoleActivities,
  getSharedTimeLogged,
  formatDuration,
  formatRelativeTime,
} from '../utils/roleUtils';

interface VennDiagramProps {
  roles: Role[];
  activities: Activity[];
  selectedRoleIds: string[];
  onSelectionChange: (roleIds: string[]) => void;
  onRoleTap?: (roleId: string) => void;
}

const polarToCartesian = (cx: number, cy: number, r: number, angle: number) => ({
  x: cx + r * Math.cos(angle),
  y: cy + r * Math.sin(angle),
});

function buildSegmentPath(
  cx: number, cy: number,
  outerR: number, innerR: number,
  startAngle: number, endAngle: number
): string {
  const oStart = polarToCartesian(cx, cy, outerR, startAngle);
  const oEnd   = polarToCartesian(cx, cy, outerR, endAngle);
  const iStart = polarToCartesian(cx, cy, innerR, startAngle);
  const iEnd   = polarToCartesian(cx, cy, innerR, endAngle);
  const large  = endAngle - startAngle > Math.PI ? 1 : 0;
  return [
    `M ${oStart.x.toFixed(3)} ${oStart.y.toFixed(3)}`,
    `A ${outerR} ${outerR} 0 ${large} 1 ${oEnd.x.toFixed(3)} ${oEnd.y.toFixed(3)}`,
    `L ${iEnd.x.toFixed(3)} ${iEnd.y.toFixed(3)}`,
    `A ${innerR} ${innerR} 0 ${large} 0 ${iStart.x.toFixed(3)} ${iStart.y.toFixed(3)}`,
    'Z',
  ].join(' ');
}

function GravityDots({ gravity, color }: { gravity?: number; color: string }) {
  const g = gravity || 3;
  return (
    <div className="flex items-center gap-0.5 mt-0.5">
      {[1, 2, 3, 4, 5].map((level) => (
        <div key={level} className="rounded-full" style={{
          width: level <= g ? 5 : 4, height: level <= g ? 5 : 4,
          backgroundColor: level <= g ? color : `${color}30`,
          opacity: level <= g ? 0.85 : 0.4,
        }} />
      ))}
    </div>
  );
}

// ── Hover state ────────────────────────────────────────────────────────────────
interface HoverState {
  roleId: string;
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  accMoved: number;
  activityIdx: number;
}

const CYCLE_DIST = 32; // px of mouse travel before cycling to next activity

export function VennDiagram({
  roles,
  activities,
  selectedRoleIds,
  onSelectionChange,
  onRoleTap,
}: VennDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<HoverState | null>(null);

  const times = useMemo(() => getRoleTimeLogged(activities, roles), [activities, roles]);
  const totalTime = useMemo(() => Object.values(times).reduce((a, b) => a + b, 0), [times]);

  const sharedPairs = useMemo(() => {
    const pairs: { r1: Role; r2: Role; time: number }[] = [];
    for (let i = 0; i < roles.length; i++)
      for (let j = i + 1; j < roles.length; j++) {
        const t = getSharedTimeLogged(activities, roles[i].id, roles[j].id);
        if (t > 0) pairs.push({ r1: roles[i], r2: roles[j], time: t });
      }
    return pairs.sort((a, b) => b.time - a.time);
  }, [activities, roles]);

  // Hover activity lookup
  const hoverRoleActivities = useMemo(() => {
    if (!hover) return [];
    return getRoleActivities(activities, hover.roleId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [activities, hover?.roleId]);

  const hoverActivity = hover && hoverRoleActivities.length > 0
    ? hoverRoleActivities[hover.activityIdx % hoverRoleActivities.length]
    : null;

  const hoverRole = hover ? roles.find((r) => r.id === hover.roleId) ?? null : null;

  // Mouse handlers
  const handleSegmentMouseMove = (roleId: string, e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setHover((prev) => {
      if (!prev || prev.roleId !== roleId) {
        return { roleId, x, y, prevX: x, prevY: y, accMoved: 0, activityIdx: 0 };
      }
      const dist = Math.hypot(x - prev.prevX, y - prev.prevY);
      const newAcc = prev.accMoved + dist;
      if (newAcc >= CYCLE_DIST) {
        return { ...prev, x, y, prevX: x, prevY: y, accMoved: 0, activityIdx: prev.activityIdx + 1 };
      }
      return { ...prev, x, y, prevX: x, prevY: y, accMoved: newAcc };
    });
  };

  const handleSvgMouseLeave = () => setHover(null);

  const handleRoleClick = (roleId: string) => {
    if (onRoleTap) { onRoleTap(roleId); return; }
    if (selectedRoleIds.includes(roleId)) {
      onSelectionChange(selectedRoleIds.filter((id) => id !== roleId));
    } else {
      onSelectionChange([...selectedRoleIds, roleId]);
    }
  };

  if (roles.length === 0) return null;

  // Proportions
  const GHOST_FRAC = 0.04;
  const ghostCount = roles.filter((r) => !times[r.id]).length;
  const dataAllocation = totalTime > 0 ? 1 - ghostCount * GHOST_FRAC : 1;
  const proportions = roles.map((role) => {
    if (totalTime === 0) return 1 / roles.length;
    const t = times[role.id] || 0;
    return t === 0 ? GHOST_FRAC : (t / totalTime) * dataAllocation;
  });

  // SVG
  const SIZE = 220;
  const CX = SIZE / 2, CY = SIZE / 2;
  const OUTER_R = 84, INNER_R = 50;
  const GAP = roles.length === 1 ? 0 : 0.045;
  const POP = 10;

  let angle = -Math.PI / 2;
  const segments = roles.map((role, idx) => {
    const proportion = proportions[idx];
    const span = Math.max(0.01, proportion * Math.PI * 2 - GAP);
    const startAngle = angle + GAP / 2;
    const endAngle = startAngle + span;
    const midAngle = (startAngle + endAngle) / 2;
    angle += proportion * Math.PI * 2;

    const isSelected = selectedRoleIds.includes(role.id);
    const isDimmed  = selectedRoleIds.length > 0 && !isSelected;
    const color = PRESET_COLORS[role.color];
    const time = times[role.id] || 0;
    const isEmpty = time === 0 && totalTime > 0;
    const percentage = totalTime > 0 ? Math.round((time / totalTime) * 100) : Math.round(100 / roles.length);
    const tx = isSelected ? Math.cos(midAngle) * POP : 0;
    const ty = isSelected ? Math.sin(midAngle) * POP : 0;
    const path = buildSegmentPath(CX, CY, OUTER_R, INNER_R, startAngle, endAngle);
    return { role, path, color, isSelected, isDimmed, isEmpty, tx, ty, time, percentage };
  });

  const selectedRole = selectedRoleIds.length === 1 ? roles.find((r) => r.id === selectedRoleIds[0]) : null;
  const selectedTime = selectedRole ? times[selectedRole.id] || 0 : totalTime;

  // Tooltip position
  const TOOLTIP_W = 196;
  const tooltipLeft = hover
    ? hover.x > SIZE * 0.55 ? hover.x - TOOLTIP_W - 10 : hover.x + 14
    : 0;
  const tooltipTop = hover ? Math.max(4, hover.y - 28) : 0;

  return (
    <div className="w-full flex flex-col gap-4 select-none">

      {/* ── Donut ─────────────────────────────────────────── */}
      <div className="flex justify-center">
        <div ref={containerRef} className="relative" style={{ width: SIZE, height: SIZE }}>
          <svg
            width={SIZE} height={SIZE}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            className="w-full max-w-[280px] overflow-visible"
            onMouseLeave={handleSvgMouseLeave}
          >
            {segments.map(({ role, path, color, isSelected, isDimmed, isEmpty, tx, ty }) => (
              <motion.g
                key={role.id}
                onClick={() => handleRoleClick(role.id)}
                onMouseMove={(e) => handleSegmentMouseMove(role.id, e)}
                style={{ cursor: 'pointer' }}
                animate={{ x: tx, y: ty, opacity: isDimmed ? 0.28 : 1 }}
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                whileTap={{ scale: 0.97 }}
              >
                <path
                  d={path}
                  fill={isEmpty ? `${color}35` : isSelected ? color : role.aspirational ? `${color}80` : `${color}CC`}
                  stroke="white"
                  strokeWidth={3}
                  strokeLinejoin="round"
                />
                {role.aspirational && (
                  <path d={path} fill="none" stroke={color} strokeWidth={2.5}
                    strokeDasharray="5 4" strokeLinejoin="round" opacity={0.55} />
                )}
                {isSelected && (
                  <path d={path} fill="none" stroke="white" strokeWidth={5} opacity={0.4} />
                )}
              </motion.g>
            ))}
          </svg>

          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <AnimatePresence mode="wait">
              {selectedRole ? (
                <motion.div key={selectedRole.id}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.22 }} className="text-center px-2"
                >
                  <div className="text-3xl mb-1 leading-none">{selectedRole.emoji}</div>
                  <div className="text-sm font-bold text-warm-900 leading-tight">{selectedRole.name}</div>
                  <div className="text-sm font-bold mt-0.5" style={{ color: PRESET_COLORS[selectedRole.color] }}>
                    {formatDuration(selectedTime)}
                  </div>
                  {selectedRole.aspirational && (
                    <div className="flex items-center justify-center gap-1 mt-1 text-[10px] text-warm-800/50">
                      <SparklesIcon className="w-2.5 h-2.5" /> Growing
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div key="total"
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.22 }} className="text-center"
                >
                  <div className="text-2xl font-bold text-warm-900 leading-none">
                    {totalTime > 0 ? formatDuration(totalTime) : String(roles.length)}
                  </div>
                  <div className="text-[11px] text-warm-800/45 mt-1 leading-tight">
                    {totalTime > 0 ? 'total logged' : 'roles in\nyour life'}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Activity preview tooltip ──────────────────── */}
          <AnimatePresence>
            {hoverActivity && hoverRole && (
              <motion.div
                key="tooltip"
                initial={{ opacity: 0, scale: 0.9, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 4 }}
                transition={{ duration: 0.14, ease: 'easeOut' }}
                className="absolute z-50 pointer-events-none bg-white rounded-2xl shadow-lg border border-warm-100 overflow-hidden"
                style={{
                  width: TOOLTIP_W,
                  left: tooltipLeft,
                  top: tooltipTop,
                  borderLeft: `3px solid ${PRESET_COLORS[hoverRole.color]}`,
                }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={hoverActivity.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.1 }}
                    className="px-3 py-2.5"
                  >
                    {/* Activity name */}
                    <div className="font-semibold text-warm-900 text-sm leading-snug mb-1 truncate">
                      {hoverActivity.name}
                    </div>

                    {/* Duration + time */}
                    <div className="flex items-center gap-1.5 text-[11px] text-warm-800/50 mb-1.5">
                      <span className="font-medium">{formatDuration(hoverActivity.duration)}</span>
                      <span>·</span>
                      <span>{formatRelativeTime(hoverActivity.timestamp)}</span>
                    </div>

                    {/* Multi-role pills */}
                    {hoverActivity.roleIds.length > 1 && (
                      <div className="flex flex-wrap gap-1">
                        {hoverActivity.roleIds.map((rid) => {
                          const r = roles.find((ro) => ro.id === rid);
                          if (!r) return null;
                          const c = PRESET_COLORS[r.color];
                          return (
                            <span key={rid} className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                              style={{ backgroundColor: `${c}20`, color: c }}>
                              {r.emoji} {r.name}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* Note */}
                    {hoverActivity.note && (
                      <p className="text-[11px] text-warm-800/40 mt-1.5 italic leading-snug line-clamp-2">
                        "{hoverActivity.note}"
                      </p>
                    )}

                    {/* Cycle hint when multiple activities exist */}
                    {hoverRoleActivities.length > 1 && (
                      <div className="flex items-center gap-1 mt-2 pt-1.5 border-t border-warm-100">
                        <div className="flex gap-0.5">
                          {hoverRoleActivities.slice(0, Math.min(5, hoverRoleActivities.length)).map((_, i) => (
                            <div key={i} className="w-1 h-1 rounded-full transition-all"
                              style={{
                                backgroundColor: PRESET_COLORS[hoverRole.color],
                                opacity: i === hover!.activityIdx % hoverRoleActivities.length ? 1 : 0.25,
                              }} />
                          ))}
                        </div>
                        <span className="text-[10px] text-warm-800/35">move to browse</span>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>

      {/* ── Role Legend Grid ───────────────────────────── */}
      <div className="grid grid-cols-2 gap-2">
        {segments.map(({ role, time, color, percentage, isSelected, isDimmed, isEmpty }) => (
          <motion.button key={role.id} onClick={() => handleRoleClick(role.id)}
            className="flex items-center gap-2.5 p-2.5 rounded-2xl text-left"
            style={{
              backgroundColor: `${color}18`,
              outline: isSelected ? `2px solid ${color}` : '2px solid transparent',
              outlineOffset: '-2px',
            }}
            animate={{ opacity: isDimmed ? 0.35 : 1 }}
            transition={{ duration: 0.2 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ backgroundColor: `${color}28` }}>
              {role.emoji}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <span className="font-semibold text-warm-900 text-xs truncate leading-tight">{role.name}</span>
                {role.aspirational && <SparklesIcon className="w-3 h-3 flex-shrink-0" style={{ color }} />}
              </div>
              <GravityDots gravity={role.gravity} color={color} />
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[11px] text-warm-800/50">{formatDuration(time)}</span>
                {totalTime > 0 && !isEmpty && (
                  <span className="text-[11px] font-bold" style={{ color }}>{percentage}%</span>
                )}
                {isEmpty && <span className="text-[10px] text-warm-800/30 italic">none yet</span>}
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* ── Shared bridges ────────────────────────────── */}
      {sharedPairs.length > 0 && selectedRoleIds.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex flex-wrap gap-2 justify-center pt-1">
          {sharedPairs.map((pair, idx) => (
            <motion.div key={idx} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => onSelectionChange([pair.r1.id, pair.r2.id])}
              className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-warm-200 shadow-sm text-xs font-medium text-warm-800 hover:bg-warm-50 hover:border-warm-300 transition-all">
              <span>{pair.r1.emoji}</span>
              <div className="w-3 h-[2px] bg-warm-300 rounded-full" />
              <span>{pair.r2.emoji}</span>
              <span className="ml-1 opacity-60 font-bold">{formatDuration(pair.time)}</span>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* ── Clear selection ───────────────────────────── */}
      {selectedRoleIds.length > 0 && (
        <div className="flex justify-center">
          <button onClick={(e) => { e.stopPropagation(); onSelectionChange([]); }}
            className="bg-white px-4 py-2 rounded-full text-xs font-bold text-warm-800 shadow-sm border border-warm-200 hover:bg-warm-50 transition-colors">
            Clear Selection
          </button>
        </div>
      )}
    </div>
  );
}

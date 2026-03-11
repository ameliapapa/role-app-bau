import React, { useEffect, useMemo, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { Role, Activity, PRESET_COLORS, TimePeriod } from '../types';
import { formatDuration } from '../utils/roleUtils';
interface CalendarPageProps {
  roles: Role[];
  activities: Activity[];
  onOpenAddWithTime: (timestamp: number) => void;
}
type ViewMode = 'day' | 'week' | 'quarter';
// Helper: detect overlapping activities and assign layout columns
function layoutOverlaps(acts: Activity[]): Map<
  string,
  {
    col: number;
    totalCols: number;
    conflictIds: string[];
  }>
{
  const sorted = [...acts].sort((a, b) => a.timestamp - b.timestamp);
  const result = new Map<
    string,
    {
      col: number;
      totalCols: number;
      conflictIds: string[];
    }>(
  );
  // Build conflict groups (connected components of overlapping activities)
  const groups: Activity[][] = [];
  const visited = new Set<string>();
  for (const act of sorted) {
    if (visited.has(act.id)) continue;
    const group: Activity[] = [act];
    visited.add(act.id);
    // Find all activities that overlap with anything in this group
    let changed = true;
    while (changed) {
      changed = false;
      for (const other of sorted) {
        if (visited.has(other.id)) continue;
        // Check if other overlaps with any activity in the group
        for (const member of group) {
          const memberEnd = member.timestamp + member.duration * 60000;
          const otherEnd = other.timestamp + other.duration * 60000;
          if (member.timestamp < otherEnd && other.timestamp < memberEnd) {
            group.push(other);
            visited.add(other.id);
            changed = true;
            break;
          }
        }
      }
    }
    groups.push(group);
  }
  for (const group of groups) {
    if (group.length === 1) {
      result.set(group[0].id, {
        col: 0,
        totalCols: 1,
        conflictIds: []
      });
      continue;
    }
    // Assign columns greedily
    const sortedGroup = [...group].sort((a, b) => a.timestamp - b.timestamp);
    const columns: Activity[][] = [];
    const conflictIds = sortedGroup.map((a) => a.id);
    for (const act of sortedGroup) {
      let placed = false;
      for (let c = 0; c < columns.length; c++) {
        const lastInCol = columns[c][columns[c].length - 1];
        const lastEnd = lastInCol.timestamp + lastInCol.duration * 60000;
        if (act.timestamp >= lastEnd) {
          columns[c].push(act);
          result.set(act.id, {
            col: c,
            totalCols: 0,
            conflictIds
          });
          placed = true;
          break;
        }
      }
      if (!placed) {
        columns.push([act]);
        result.set(act.id, {
          col: columns.length - 1,
          totalCols: 0,
          conflictIds
        });
      }
    }
    // Update totalCols for all in group
    for (const act of sortedGroup) {
      const entry = result.get(act.id)!;
      entry.totalCols = columns.length;
    }
  }
  return result;
}
// Helper: find conflict pairs for display
function findConflicts(
acts: Activity[],
roles: Role[])
: {
  act1: Activity;
  act2: Activity;
  role1?: Role;
  role2?: Role;
  overlapMinutes: number;
}[] {
  const conflicts: {
    act1: Activity;
    act2: Activity;
    role1?: Role;
    role2?: Role;
    overlapMinutes: number;
  }[] = [];
  for (let i = 0; i < acts.length; i++) {
    for (let j = i + 1; j < acts.length; j++) {
      const a = acts[i],
        b = acts[j];
      const aEnd = a.timestamp + a.duration * 60000;
      const bEnd = b.timestamp + b.duration * 60000;
      if (a.timestamp < bEnd && b.timestamp < aEnd) {
        const overlapStart = Math.max(a.timestamp, b.timestamp);
        const overlapEnd = Math.min(aEnd, bEnd);
        const overlapMinutes = Math.round((overlapEnd - overlapStart) / 60000);
        conflicts.push({
          act1: a,
          act2: b,
          role1: roles.find((r) => r.id === a.roleIds[0]),
          role2: roles.find((r) => r.id === b.roleIds[0]),
          overlapMinutes
        });
      }
    }
  }
  return conflicts;
}
export function CalendarPage({
  roles,
  activities,
  onOpenAddWithTime
}: CalendarPageProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [currentDate, setCurrentDate] = useState(new Date());
  const scrollRef = useRef<HTMLDivElement>(null);
  // Constants for layout
  const HOUR_HEIGHT = 60; // pixels per hour
  const START_HOUR = 0; // 12 AM
  const END_HOUR = 24; // 12 AM next day
  const HOURS = Array.from(
    {
      length: END_HOUR - START_HOUR
    },
    (_, i) => i + START_HOUR
  );
  // Scroll to current time on initial load if looking at today
  useEffect(() => {
    if (viewMode !== 'quarter') {
      const today = new Date();
      if (
      currentDate.getDate() === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear())
      {
        if (scrollRef.current) {
          const currentHour = today.getHours();
          const scrollPosition = Math.max(0, (currentHour - 2) * HOUR_HEIGHT);
          scrollRef.current.scrollTop = scrollPosition;
        }
      }
    }
  }, [currentDate, viewMode]);
  const navigateDate = (direction: 1 | -1) => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') {
      newDate.setDate(currentDate.getDate() + direction);
    } else if (viewMode === 'week') {
      newDate.setDate(currentDate.getDate() + direction * 7);
    } else if (viewMode === 'quarter') {
      newDate.setMonth(currentDate.getMonth() + direction * 3);
    }
    setCurrentDate(newDate);
  };
  const goToToday = () => {
    setCurrentDate(new Date());
  };
  const formatHeaderDate = () => {
    if (viewMode === 'day') {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      if (currentDate.toDateString() === today.toDateString()) return 'Today';
      if (currentDate.toDateString() === tomorrow.toDateString())
      return 'Tomorrow';
      if (currentDate.toDateString() === yesterday.toDateString())
      return 'Yesterday';
      return currentDate.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    } else if (viewMode === 'week') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      const startStr = startOfWeek.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric'
      });
      const endStr = endOfWeek.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric'
      });
      return `${startStr} - ${endStr}`;
    } else {
      // Quarter view: show the year and quarter
      const quarter = Math.floor(currentDate.getMonth() / 3) + 1;
      return `Q${quarter} ${currentDate.getFullYear()}`;
    }
  };
  // Current time indicator
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);
  // --- DAY VIEW LOGIC ---
  const dayActivities = useMemo(() => {
    const startOfDay = new Date(currentDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(currentDate);
    endOfDay.setHours(23, 59, 59, 999);
    return activities.filter(
      (a) =>
      a.timestamp >= startOfDay.getTime() &&
      a.timestamp <= endOfDay.getTime()
    );
  }, [activities, currentDate]);
  const dayConflicts = useMemo(() => {
    return findConflicts(dayActivities, roles);
  }, [dayActivities, roles]);
  const dayLayout = useMemo(() => {
    return layoutOverlaps(dayActivities);
  }, [dayActivities]);
  const handleDayGridClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const clickedHour = START_HOUR + Math.floor(y / HOUR_HEIGHT);
    const clickedMinute = Math.floor(y % HOUR_HEIGHT / HOUR_HEIGHT * 60);
    const roundedMinute = Math.round(clickedMinute / 15) * 15;
    const clickDate = new Date(currentDate);
    clickDate.setHours(clickedHour, roundedMinute, 0, 0);
    onOpenAddWithTime(clickDate.getTime());
  };
  // --- WEEK VIEW LOGIC ---
  const weekDays = useMemo(() => {
    const days = [];
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay()); // Start on Sunday
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      days.push(d);
    }
    return days;
  }, [currentDate]);
  const handleWeekGridClick = (
  e: React.MouseEvent<HTMLDivElement>,
  dayDate: Date) =>
  {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const clickedHour = START_HOUR + Math.floor(y / HOUR_HEIGHT);
    const clickedMinute = Math.floor(y % HOUR_HEIGHT / HOUR_HEIGHT * 60);
    const roundedMinute = Math.round(clickedMinute / 15) * 15;
    const clickDate = new Date(dayDate);
    clickDate.setHours(clickedHour, roundedMinute, 0, 0);
    onOpenAddWithTime(clickDate.getTime());
  };
  // --- QUARTER VIEW LOGIC ---
  const quarterMonths = useMemo(() => {
    const quarterStartMonth = Math.floor(currentDate.getMonth() / 3) * 3;
    return [0, 1, 2].map((offset) => {
      const d = new Date(
        currentDate.getFullYear(),
        quarterStartMonth + offset,
        1
      );
      return d;
    });
  }, [currentDate]);
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };
  return (
    <div className="min-h-screen pb-28 pt-8 flex flex-col max-w-lg mx-auto h-screen">
      {/* Header */}
      <header className="px-6 mb-4 shrink-0">
        <div className="flex justify-between items-end mb-4">
          <h1 className="text-3xl font-bold text-warm-900">Plan</h1>

          <div className="flex bg-warm-200/50 rounded-lg p-1">
            {(['day', 'week', 'quarter'] as ViewMode[]).map((mode) =>
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 text-xs font-bold rounded-md capitalize transition-all ${viewMode === mode ? 'bg-white shadow-sm text-warm-900' : 'text-warm-800/60 hover:text-warm-900'}`}>

                {mode}
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between bg-white rounded-2xl p-2 shadow-sm border border-warm-200">
          <button
            onClick={() => navigateDate(-1)}
            className="p-2 hover:bg-warm-100 rounded-xl transition-colors text-warm-800">

            <ChevronLeftIcon className="w-5 h-5" />
          </button>

          <button
            onClick={goToToday}
            className="font-semibold text-warm-900 px-4 py-2 hover:bg-warm-50 rounded-xl transition-colors">

            {formatHeaderDate()}
          </button>

          <button
            onClick={() => navigateDate(1)}
            className="p-2 hover:bg-warm-100 rounded-xl transition-colors text-warm-800">

            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Conflict Banner */}
      <AnimatePresence>
        {viewMode === 'day' && dayConflicts.length > 0 &&
        <motion.div
          initial={{
            opacity: 0,
            height: 0
          }}
          animate={{
            opacity: 1,
            height: 'auto'
          }}
          exit={{
            opacity: 0,
            height: 0
          }}
          className="px-6 mb-3 shrink-0">

            <div className="bg-warm-100/80 border border-dashed border-warm-300 rounded-2xl p-3">
              <p className="text-sm font-medium text-warm-800/70">
                {dayConflicts.length} overlapping{' '}
                {dayConflicts.length === 1 ? 'commitment' : 'commitments'}
              </p>
              {dayConflicts.map((conflict, i) =>
            <p key={i} className="text-xs text-warm-800/50 mt-0.5">
                  {conflict.role1?.emoji} {conflict.act1.name} ·{' '}
                  {conflict.role2?.emoji} {conflict.act2.name} ·{' '}
                  {conflict.overlapMinutes}min overlap
                </p>
            )}
            </div>
          </motion.div>
        }
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col relative">
        {/* DAY VIEW */}
        {viewMode === 'day' &&
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 pb-12 relative no-scrollbar">

            <div
            className="relative"
            style={{
              height: `${HOURS.length * HOUR_HEIGHT}px`
            }}>

              {/* Background Grid Lines */}
              {HOURS.map((hour) =>
            <div
              key={hour}
              className="absolute w-full flex border-t border-warm-200/60"
              style={{
                top: `${(hour - START_HOUR) * HOUR_HEIGHT}px`,
                height: `${HOUR_HEIGHT}px`
              }}>

                  <div className="w-14 shrink-0 -mt-2.5 bg-warm-100 pr-2 text-right">
                    <span className="text-xs font-medium text-warm-800/40">
                      {hour === 0 ?
                  '12 AM' :
                  hour < 12 ?
                  `${hour} AM` :
                  hour === 12 ?
                  '12 PM' :
                  `${hour - 12} PM`}
                    </span>
                  </div>
                  <div className="flex-1" />
                </div>
            )}

              {/* Clickable Area */}
              <div
              className="absolute top-0 right-0 bottom-0 left-14 cursor-pointer"
              onClick={handleDayGridClick} />


              {/* Current Time Indicator */}
              {currentDate.toDateString() === now.toDateString() &&
            <div
              className="absolute left-14 right-0 z-20 flex items-center pointer-events-none"
              style={{
                top: `${(now.getHours() + now.getMinutes() / 60 - START_HOUR) * HOUR_HEIGHT}px`
              }}>

                  <div className="w-2 h-2 rounded-full bg-role-coral -ml-1" />
                  <div className="flex-1 h-[2px] bg-role-coral/50" />
                </div>
            }

              {/* Activity Blocks */}
              {dayActivities.map((activity) => {
              const date = new Date(activity.timestamp);
              const startHour = date.getHours() + date.getMinutes() / 60;
              const top = (startHour - START_HOUR) * HOUR_HEIGHT;
              const height = Math.max(
                20,
                activity.duration / 60 * HOUR_HEIGHT
              );
              const primaryRole = roles.find(
                (r) => r.id === activity.roleIds[0]
              );
              const color = primaryRole ?
              PRESET_COLORS[primaryRole.color] :
              '#4A4A45';
              const layout = dayLayout.get(activity.id) || {
                col: 0,
                totalCols: 1,
                conflictIds: []
              };
              const hasConflict = layout.conflictIds.length > 0;
              const colWidth = hasConflict ?
              `calc(${100 / layout.totalCols}% - 4px)` :
              undefined;
              const colLeft = hasConflict ?
              `calc(${layout.col / layout.totalCols * 100}%)` :
              undefined;
              return (
                <motion.div
                  key={activity.id}
                  initial={{
                    opacity: 0,
                    scale: 0.95
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1
                  }}
                  className={`absolute rounded-xl p-2 shadow-sm overflow-hidden group ${hasConflict ? 'border-dashed border-2' : 'border'}`}
                  style={{
                    top: `${top}px`,
                    height: `${height}px`,
                    left: hasConflict ? `calc(4rem + ${colLeft})` : '4rem',
                    width: hasConflict ? colWidth : undefined,
                    right: hasConflict ? undefined : '0.5rem',
                    backgroundColor: hasConflict ?
                    `${color}18` :
                    `${color}30`,
                    borderColor: `${color}50`,
                    zIndex: 10 + layout.col
                  }}>

                    <div className="flex items-start gap-2 h-full">
                      {primaryRole &&
                    <span className="text-sm shrink-0">
                          {primaryRole.emoji}
                        </span>
                    }
                      <div className="flex flex-col min-w-0 overflow-hidden">
                        <span className="text-xs font-bold text-warm-900 truncate leading-tight">
                          {activity.name}
                        </span>
                        {height >= 40 &&
                      <span className="text-[10px] font-medium text-warm-800/70 truncate mt-0.5">
                            {formatDuration(activity.duration)}
                          </span>
                      }
                      </div>
                    </div>
                  </motion.div>);

            })}
            </div>
          </div>
        }

        {/* WEEK VIEW */}
        {viewMode === 'week' &&
        <div className="flex flex-col flex-1 overflow-hidden">
            {/* Week Header */}
            <div className="flex pl-10 pr-2 pb-2 border-b border-warm-200 shrink-0">
              {weekDays.map((day, i) =>
            <div key={i} className="flex-1 flex flex-col items-center">
                  <span className="text-[10px] font-medium text-warm-800/60 uppercase">
                    {day.toLocaleDateString(undefined, {
                  weekday: 'narrow'
                })}
                  </span>
                  <span
                className={`text-sm font-bold mt-0.5 w-7 h-7 flex items-center justify-center rounded-full ${day.toDateString() === now.toDateString() ? 'bg-warm-900 text-white' : 'text-warm-900'}`}>

                    {day.getDate()}
                  </span>
                </div>
            )}
            </div>

            {/* Week Grid */}
            <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto overflow-x-hidden relative no-scrollbar">

              <div
              className="relative flex"
              style={{
                height: `${HOURS.length * HOUR_HEIGHT}px`
              }}>

                {/* Time Labels */}
                <div className="w-10 shrink-0 relative border-r border-warm-200/60 bg-warm-100 z-10">
                  {HOURS.map((hour) =>
                <div
                  key={hour}
                  className="absolute w-full text-right pr-1 -mt-2"
                  style={{
                    top: `${(hour - START_HOUR) * HOUR_HEIGHT}px`
                  }}>

                      <span className="text-[10px] font-medium text-warm-800/40">
                        {hour === 0 ?
                    '12a' :
                    hour < 12 ?
                    `${hour}a` :
                    hour === 12 ?
                    '12p' :
                    `${hour - 12}p`}
                      </span>
                    </div>
                )}
                </div>

                {/* Day Columns */}
                <div className="flex-1 flex relative">
                  {/* Horizontal Grid Lines */}
                  <div className="absolute inset-0 pointer-events-none">
                    {HOURS.map((hour) =>
                  <div
                    key={hour}
                    className="absolute w-full border-t border-warm-200/40"
                    style={{
                      top: `${(hour - START_HOUR) * HOUR_HEIGHT}px`
                    }} />

                  )}
                  </div>

                  {weekDays.map((day, dayIndex) => {
                  const startOfDay = new Date(day);
                  startOfDay.setHours(0, 0, 0, 0);
                  const endOfDay = new Date(day);
                  endOfDay.setHours(23, 59, 59, 999);
                  const dayActs = activities.filter(
                    (a) =>
                    a.timestamp >= startOfDay.getTime() &&
                    a.timestamp <= endOfDay.getTime()
                  );
                  return (
                    <div
                      key={dayIndex}
                      className="flex-1 relative border-r border-warm-200/40 last:border-r-0">

                        <div
                        className="absolute inset-0 cursor-pointer"
                        onClick={(e) => handleWeekGridClick(e, day)} />


                        {/* Current Time Indicator for this day */}
                        {day.toDateString() === now.toDateString() &&
                      <div
                        className="absolute left-0 right-0 z-20 pointer-events-none"
                        style={{
                          top: `${(now.getHours() + now.getMinutes() / 60 - START_HOUR) * HOUR_HEIGHT}px`
                        }}>

                            <div className="w-full h-[2px] bg-role-coral/50 relative">
                              <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-role-coral" />
                            </div>
                          </div>
                      }

                        {/* Activity Blocks */}
                        {dayActs.map((activity) => {
                        const date = new Date(activity.timestamp);
                        const startHour =
                        date.getHours() + date.getMinutes() / 60;
                        const top = (startHour - START_HOUR) * HOUR_HEIGHT;
                        const height = Math.max(
                          15,
                          activity.duration / 60 * HOUR_HEIGHT
                        );
                        const primaryRole = roles.find(
                          (r) => r.id === activity.roleIds[0]
                        );
                        const color = primaryRole ?
                        PRESET_COLORS[primaryRole.color] :
                        '#4A4A45';
                        return (
                          <motion.div
                            key={activity.id}
                            initial={{
                              opacity: 0
                            }}
                            animate={{
                              opacity: 1
                            }}
                            className="absolute left-0.5 right-0.5 rounded-md p-1 shadow-sm border overflow-hidden"
                            style={{
                              top: `${top}px`,
                              height: `${height}px`,
                              backgroundColor: `${color}30`,
                              borderColor: `${color}60`,
                              zIndex: 10
                            }}>

                              {height >= 30 && primaryRole &&
                            <div className="text-[10px] leading-none mb-0.5">
                                  {primaryRole.emoji}
                                </div>
                            }
                              {height >= 20 &&
                            <div className="text-[9px] font-bold text-warm-900 truncate leading-tight">
                                  {activity.name}
                                </div>
                            }
                            </motion.div>);

                      })}
                      </div>);

                })}
                </div>
              </div>
            </div>
          </div>
        }

        {/* QUARTER VIEW */}
        {viewMode === 'quarter' &&
        <div className="flex-1 overflow-y-auto px-4 pb-12 no-scrollbar space-y-6">
            {quarterMonths.map((monthDate, i) => {
            const year = monthDate.getFullYear();
            const month = monthDate.getMonth();
            const daysInMonth = getDaysInMonth(year, month);
            const firstDay = getFirstDayOfMonth(year, month);
            const days = Array.from(
              {
                length: daysInMonth
              },
              (_, i) => i + 1
            );
            const blanks = Array.from(
              {
                length: firstDay
              },
              (_, i) => i
            );
            return (
              <div
                key={i}
                className="bg-white rounded-3xl p-4 shadow-sm border border-warm-200">

                  <h3 className="text-lg font-bold text-warm-900 mb-4 ml-2">
                    {monthDate.toLocaleDateString(undefined, {
                    month: 'long',
                    year: 'numeric'
                  })}
                  </h3>

                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) =>
                  <div
                    key={i}
                    className="text-center text-[10px] font-bold text-warm-800/40">

                        {d}
                      </div>
                  )}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {blanks.map((b) =>
                  <div key={`blank-${b}`} className="aspect-square" />
                  )}

                    {days.map((day) => {
                    const date = new Date(year, month, day);
                    const isToday = date.toDateString() === now.toDateString();
                    // Find activities for this day
                    const startOfDay = new Date(date);
                    startOfDay.setHours(0, 0, 0, 0);
                    const endOfDay = new Date(date);
                    endOfDay.setHours(23, 59, 59, 999);
                    const dayActs = activities.filter(
                      (a) =>
                      a.timestamp >= startOfDay.getTime() &&
                      a.timestamp <= endOfDay.getTime()
                    );
                    // Find dominant role for the day
                    let dominantColor = 'transparent';
                    if (dayActs.length > 0) {
                      const roleCounts: Record<string, number> = {};
                      dayActs.forEach((a) => {
                        a.roleIds.forEach((id) => {
                          roleCounts[id] = (roleCounts[id] || 0) + a.duration;
                        });
                      });
                      const dominantRoleId = Object.keys(roleCounts).reduce(
                        (a, b) => roleCounts[a] > roleCounts[b] ? a : b
                      );
                      const role = roles.find((r) => r.id === dominantRoleId);
                      if (role) dominantColor = PRESET_COLORS[role.color];
                    }
                    return (
                      <div
                        key={day}
                        className={`aspect-square rounded-lg flex items-center justify-center relative overflow-hidden transition-all cursor-pointer ${isToday ? 'ring-2 ring-warm-900 ring-offset-1' : ''}`}
                        style={{
                          backgroundColor:
                          dayActs.length > 0 ?
                          `${dominantColor}30` :
                          '#F0F0E8',
                          border:
                          dayActs.length > 0 ?
                          `1px solid ${dominantColor}60` :
                          '1px solid transparent'
                        }}
                        onClick={() => {
                          setCurrentDate(date);
                          setViewMode('day');
                        }}>

                          <span
                          className={`text-xs font-medium z-10 ${dayActs.length > 0 ? 'text-warm-900' : 'text-warm-800/60'}`}>

                            {day}
                          </span>
                        </div>);

                  })}
                  </div>
                </div>);

          })}
          </div>
        }
      </div>
    </div>);

}
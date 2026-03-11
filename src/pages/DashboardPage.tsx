import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRightIcon } from 'lucide-react';
import { Role, Activity, TimePeriod, PRESET_COLORS } from '../types';
import { VennDiagram } from '../components/VennDiagram';
import { ActivityCard } from '../components/ActivityCard';
import { FocusModeIndicator } from '../components/FocusModeIndicator';
import { RoleTransitionModal } from '../components/RoleTransitionModal';
import {
  getActivitiesByExactRoles,
  getRoleActivities,
  getActivitiesInPeriod,
} from '../utils/roleUtils';

interface DashboardPageProps {
  roles: Role[];
  activities: Activity[];
  selectedRoleIds: string[];
  activeRoleId?: string;
  onSelectionChange: (roleIds: string[]) => void;
  onDeleteActivity: (id: string) => void;
  onRoleTap: (roleId: string) => void;
  onSetActiveRole: (roleId: string | null) => void;
  onOpenQuickAdd: () => void;
}

export function DashboardPage({
  roles,
  activities,
  selectedRoleIds,
  activeRoleId,
  onSelectionChange,
  onDeleteActivity,
  onRoleTap,
  onSetActiveRole,
  onOpenQuickAdd,
}: DashboardPageProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('week');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [targetRole, setTargetRole] = useState<Role | null>(null);

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  const periodActivities = useMemo(
    () => getActivitiesInPeriod(activities, timePeriod),
    [activities, timePeriod]
  );

  const displayActivities = useMemo(() => {
    if (selectedRoleIds.length === 0) return periodActivities.slice(0, 10);
    if (selectedRoleIds.length === 1) return getRoleActivities(periodActivities, selectedRoleIds[0]);
    return getActivitiesByExactRoles(periodActivities, selectedRoleIds);
  }, [periodActivities, selectedRoleIds]);

  const getSelectionTitle = () => {
    if (selectedRoleIds.length === 0) return 'Recent Flow';
    if (selectedRoleIds.length === 1) {
      const role = roles.find((r) => r.id === selectedRoleIds[0]);
      return `${role?.emoji} ${role?.name} Activities`;
    }
    return 'Shared Activities';
  };

  const getSelectionDescription = () => {
    if (selectedRoleIds.length === 0) return 'Tap a role to filter.';
    if (selectedRoleIds.length === 1) {
      const role = roles.find((r) => r.id === selectedRoleIds[0]);
      return `Activities serving your ${role?.name} role.`;
    }
    return `Activities serving ${selectedRoleIds.map((id) => roles.find((r) => r.id === id)?.name).join(' & ')}.`;
  };

  const activeRole = useMemo(
    () => roles.find((r) => r.id === activeRoleId),
    [roles, activeRoleId]
  );

  const handleSwitchFocus = (role: Role) => {
    setTargetRole(role);
    setIsTransitioning(true);
  };

  // Three distinct empty states
  const isFirstRun = activities.length === 0;
  const isPeriodEmpty = !isFirstRun && periodActivities.length === 0;

  const donutCaption = isFirstRun
    ? 'Log moments to watch your slices grow.'
    : isPeriodEmpty
    ? `Nothing logged this ${timePeriod}. Try a wider range.`
    : 'Each slice is a role in your life, sized by time logged.';

  return (
    <div className="min-h-screen pb-28 pt-8 px-4 max-w-lg mx-auto">

      <header className="mb-6 px-2 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-warm-900 mb-1">Your Flow</h1>
          <p className="text-warm-800/60 font-medium">{today}</p>
        </div>
        <div className="flex bg-warm-200/50 rounded-lg p-1">
          {(['day', 'week', 'quarter'] as TimePeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setTimePeriod(p)}
              className={`px-3 py-1.5 text-xs font-bold rounded-md capitalize transition-all ${
                timePeriod === p ? 'bg-white shadow-sm text-warm-900' : 'text-warm-800/60 hover:text-warm-900'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </header>

      <FocusModeIndicator
        activeRole={activeRole}
        roles={roles}
        isFirstRun={isFirstRun}
        onSwitchRole={handleSwitchFocus}
        onClearFocus={() => onSetActiveRole(null)}
      />

      <div className="bg-white rounded-3xl p-4 shadow-warm border border-warm-200 mb-8">
        <VennDiagram
          roles={roles}
          activities={periodActivities}
          selectedRoleIds={selectedRoleIds}
          onSelectionChange={onSelectionChange}
          onRoleTap={onRoleTap}
        />
        <p className="text-center text-xs text-warm-800/40 mt-3">{donutCaption}</p>
      </div>

      <div className="px-2">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-warm-900">{getSelectionTitle()}</h2>
          <p className="text-sm text-warm-800/60">{getSelectionDescription()}</p>
        </div>

        <div className="space-y-3">
          {displayActivities.length > 0 ? (
            <AnimatePresence initial={false}>
              {displayActivities.map((activity, idx) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  roles={roles}
                  onDelete={onDeleteActivity}
                  index={idx}
                />
              ))}
            </AnimatePresence>
          ) : isFirstRun ? (
            // ── First-run CTA ──────────────────────────────
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border-2 border-dashed border-warm-200 bg-warm-50 p-7 flex flex-col items-center text-center"
            >
              {/* Role colour dots — echo the donut above */}
              <div className="flex gap-1.5 mb-5">
                {roles.map((role) => (
                  <div
                    key={role.id}
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: PRESET_COLORS[role.color] }}
                  />
                ))}
              </div>

              <h3 className="font-semibold text-warm-900 text-base mb-1">
                Your flow starts here
              </h3>
              <p className="text-sm text-warm-800/55 mb-6 max-w-xs leading-relaxed">
                Log your first moment and watch your donut come to life.
              </p>

              <button
                onClick={onOpenQuickAdd}
                className="flex items-center gap-2 bg-warm-900 text-white px-5 py-3 rounded-xl font-medium text-sm hover:bg-warm-800 transition-colors shadow-sm"
              >
                Log what you're doing now
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </motion.div>
          ) : selectedRoleIds.length > 0 ? (
            // ── Selection empty ────────────────────────────
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 bg-warm-50 rounded-2xl border border-warm-200 border-dashed"
            >
              <p className="text-warm-800/50 text-sm">No activities found for this selection.</p>
            </motion.div>
          ) : (
            // ── Period empty ───────────────────────────────
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 bg-warm-50 rounded-2xl border border-warm-200 border-dashed"
            >
              <p className="text-warm-800/50 text-sm mb-3">
                Nothing logged this {timePeriod}.
              </p>
              <button
                onClick={onOpenQuickAdd}
                className="text-sm font-medium text-warm-900 underline underline-offset-2"
              >
                Log something now
              </button>
            </motion.div>
          )}
        </div>
      </div>

      <RoleTransitionModal
        isOpen={isTransitioning}
        onClose={() => setIsTransitioning(false)}
        currentRole={activeRole}
        targetRole={targetRole}
        onComplete={onSetActiveRole}
      />
    </div>
  );
}

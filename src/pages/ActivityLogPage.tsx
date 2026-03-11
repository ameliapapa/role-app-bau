import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { SearchIcon } from 'lucide-react';
import { Role, Activity } from '../types';
import { ActivityCard } from '../components/ActivityCard';
import { RoleChip } from '../components/RoleChip';
interface ActivityLogPageProps {
  roles: Role[];
  activities: Activity[];
  onDeleteActivity: (id: string) => void;
}
export function ActivityLogPage({
  roles,
  activities,
  onDeleteActivity
}: ActivityLogPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRoleId, setFilterRoleId] = useState<string | null>(null);
  const filteredActivities = useMemo(() => {
    return activities.filter((activity) => {
      const matchesSearch =
      activity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.note &&
      activity.note.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = filterRoleId ?
      activity.roleIds.includes(filterRoleId) :
      true;
      return matchesSearch && matchesRole;
    });
  }, [activities, searchQuery, filterRoleId]);
  // Group by day (simplified)
  const groupedActivities = useMemo(() => {
    const groups: Record<string, Activity[]> = {};
    filteredActivities.forEach((activity) => {
      const date = new Date(activity.timestamp);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      let key = date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      if (date.toDateString() === today.toDateString()) {
        key = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        key = 'Yesterday';
      }
      if (!groups[key]) groups[key] = [];
      groups[key].push(activity);
    });
    return groups;
  }, [filteredActivities]);
  return (
    <div className="min-h-screen pb-28 pt-8 px-4 max-w-lg mx-auto">
      <header className="mb-6 px-2">
        <h1 className="text-3xl font-bold text-warm-900 mb-4">History</h1>

        <div className="relative mb-4">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-warm-800/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search activities..."
            className="w-full bg-white border border-warm-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-warm-300 transition-all shadow-sm" />

        </div>

        <div className="flex overflow-x-auto no-scrollbar pb-2 -mx-2 px-2 gap-2">
          <button
            onClick={() => setFilterRoleId(null)}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filterRoleId === null ? 'bg-warm-900 text-white' : 'bg-white text-warm-800 border border-warm-200 hover:bg-warm-50'}`}>

            All
          </button>
          {roles.map((role) =>
          <RoleChip
            key={role.id}
            role={role}
            selected={filterRoleId === role.id}
            onClick={() =>
            setFilterRoleId(filterRoleId === role.id ? null : role.id)
            } />

          )}
        </div>
      </header>

      <div className="px-2 space-y-8">
        {Object.keys(groupedActivities).length > 0 ?
        Object.entries(groupedActivities).map(([date, acts], groupIndex) =>
        <div key={date}>
              <h3 className="text-sm font-bold text-warm-800/50 uppercase tracking-wider mb-3 ml-1">
                {date}
              </h3>
              <div className="space-y-3">
                {acts.map((activity, index) =>
            <motion.div
              key={activity.id}
              initial={{
                opacity: 0,
                y: 10
              }}
              animate={{
                opacity: 1,
                y: 0
              }}
              transition={{
                delay: groupIndex * 0.1 + index * 0.05
              }}>

                    <ActivityCard
                activity={activity}
                roles={roles}
                onDelete={onDeleteActivity} />

                  </motion.div>
            )}
              </div>
            </div>
        ) :

        <div className="text-center py-12">
            <p className="text-warm-800/60">No activities found.</p>
          </div>
        }
      </div>
    </div>);

}
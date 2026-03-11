import React, { useMemo, Component } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeftIcon, ClockIcon } from 'lucide-react';
import { Role, Activity, PRESET_COLORS } from '../types';
import { ActivityCard } from '../components/ActivityCard';
import { getRoleActivities, formatDuration } from '../utils/roleUtils';
interface RoleOverviewPageProps {
  role: Role;
  roles: Role[];
  activities: Activity[];
  onBack: () => void;
  onDeleteActivity: (id: string) => void;
}
export function RoleOverviewPage({
  role,
  roles,
  activities,
  onBack,
  onDeleteActivity
}: RoleOverviewPageProps) {
  const roleActivities = useMemo(
    () => getRoleActivities(activities, role.id),
    [activities, role.id]
  );
  const totalTime = useMemo(
    () => roleActivities.reduce((acc, a) => acc + (a.duration || 0), 0),
    [roleActivities]
  );
  const color = PRESET_COLORS[role.color];
  // Use a reliable placeholder image that feels inspiring/abstract
  // We use a seed based on the role name so it stays consistent for that role
  const imageUrl = `https://picsum.photos/seed/${encodeURIComponent(role.name)}/800/400`;
  return (
    <div className="min-h-screen bg-warm-100 pb-28">
      {/* Header Image & Navigation */}
      <div className="relative h-64 w-full overflow-hidden rounded-b-[3rem] shadow-warm-lg">
        <div className="absolute inset-0 bg-warm-900/20 z-10" />
        <img
          src={imageUrl}
          alt={`Inspiration for ${role.name}`}
          className="absolute inset-0 w-full h-full object-cover" />

        <div
          className="absolute inset-0 z-10 opacity-60 mix-blend-multiply"
          style={{
            backgroundColor: color
          }} />


        <div className="absolute top-0 left-0 right-0 p-4 pt-8 z-20 flex justify-between items-center">
          <button
            onClick={onBack}
            className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors">

            <ChevronLeftIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="absolute bottom-6 left-6 right-6 z-20 text-white">
          <motion.div
            initial={{
              y: 20,
              opacity: 0
            }}
            animate={{
              y: 0,
              opacity: 1
            }}
            className="flex items-center gap-3 mb-2">

            <span className="text-4xl drop-shadow-md">{role.emoji}</span>
            <h1 className="text-3xl font-bold drop-shadow-md">{role.name}</h1>
          </motion.div>
          <motion.p
            initial={{
              y: 20,
              opacity: 0
            }}
            animate={{
              y: 0,
              opacity: 1
            }}
            transition={{
              delay: 0.1
            }}
            className="text-white/90 font-medium text-lg drop-shadow-md max-w-sm leading-tight">

            "{role.motivation || `Being a great ${role.name}`}"
          </motion.p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-8">
        {/* Stats Row */}
        <div className="flex gap-4 mb-8">
          <div className="flex-1 bg-white rounded-2xl p-4 shadow-warm border border-warm-200 flex flex-col items-center justify-center">
            <span className="text-sm text-warm-800/60 font-medium mb-1">
              Total Time
            </span>
            <span className="text-2xl font-bold text-warm-900 flex items-center gap-2">
              <ClockIcon className="w-5 h-5 text-warm-800/40" />
              {formatDuration(totalTime)}
            </span>
          </div>
          <div className="flex-1 bg-white rounded-2xl p-4 shadow-warm border border-warm-200 flex flex-col items-center justify-center">
            <span className="text-sm text-warm-800/60 font-medium mb-1">
              Activities
            </span>
            <span className="text-2xl font-bold text-warm-900">
              {roleActivities.length}
            </span>
          </div>
        </div>

        {/* History List */}
        <div>
          <h2 className="text-xl font-bold text-warm-900 mb-4 px-2">
            Log History
          </h2>
          <div className="space-y-3">
            {roleActivities.length > 0 ?
            roleActivities.
            sort((a, b) => b.timestamp - a.timestamp).
            map((activity, index) =>
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
                delay: index * 0.05
              }}>

                    <ActivityCard
                activity={activity}
                roles={roles}
                onDelete={onDeleteActivity} />

                  </motion.div>
            ) :

            <div className="text-center py-12 bg-white rounded-3xl border border-warm-200 border-dashed">
                <p className="text-warm-800/60">
                  No activities logged for this role yet.
                </p>
              </div>
            }
          </div>
        </div>
      </div>
    </div>);

}
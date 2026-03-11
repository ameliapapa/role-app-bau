import React from 'react';
import { motion } from 'framer-motion';
import { TrashIcon, ClockIcon } from 'lucide-react';
import { Activity, Role } from '../types';
import { RoleChip } from './RoleChip';
import { formatRelativeTime, formatDuration } from '../utils/roleUtils';
interface ActivityCardProps {
  activity: Activity;
  roles: Role[];
  onDelete?: (id: string) => void;
}
export function ActivityCard({ activity, roles, onDelete }: ActivityCardProps) {
  const activityRoles = roles.filter((r) => activity.roleIds.includes(r.id));
  return (
    <motion.div
      layout
      initial={{
        opacity: 0,
        y: 10
      }}
      animate={{
        opacity: 1,
        y: 0
      }}
      exit={{
        opacity: 0,
        scale: 0.95
      }}
      className="bg-white rounded-2xl p-4 shadow-warm border border-warm-200 group relative overflow-hidden">

      <div className="flex justify-between items-start mb-3">
        <h3 className="font-medium text-warm-900 text-lg leading-tight pr-8">
          {activity.name}
        </h3>
        <div className="flex flex-col items-end gap-1">
          <span className="text-xs text-warm-800/60 whitespace-nowrap bg-warm-100 px-2 py-1 rounded-md">
            {formatRelativeTime(activity.timestamp)}
          </span>
          <span className="flex items-center text-xs font-medium text-warm-800/80 bg-warm-50 px-2 py-1 rounded-md border border-warm-100">
            <ClockIcon className="w-3 h-3 mr-1" />
            {formatDuration(activity.duration || 0)}
          </span>
        </div>
      </div>

      {activity.note &&
      <p className="text-sm text-warm-800/80 mb-4 line-clamp-2">
          {activity.note}
        </p>
      }

      <div className="flex flex-wrap gap-2 mt-auto">
        {activityRoles.map((role) =>
        <RoleChip key={role.id} role={role} size="sm" />
        )}
      </div>

      {onDelete &&
      <button
        onClick={() => onDelete(activity.id)}
        className="absolute top-3 right-3 p-2 text-warm-800/40 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
        aria-label="Delete activity">

          <TrashIcon className="w-4 h-4" />
        </button>
      }
    </motion.div>);

}
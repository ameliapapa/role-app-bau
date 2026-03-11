import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TargetIcon, ChevronDownIcon, SparklesIcon } from 'lucide-react';
import { Role, PRESET_COLORS } from '../types';
interface FocusModeIndicatorProps {
  activeRole?: Role;
  roles: Role[];
  isFirstRun?: boolean;
  onSwitchRole: (role: Role) => void;
  onClearFocus?: () => void;
}
export function FocusModeIndicator({
  activeRole,
  roles,
  isFirstRun = false,
  onSwitchRole,
  onClearFocus
}: FocusModeIndicatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const activeColor = activeRole ? PRESET_COLORS[activeRole.color] : '#4A4A45';
  return (
    <div className="relative z-30 mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm border border-warm-200 transition-all hover:shadow-md">

        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: `${activeColor}20`,
              color: activeColor
            }}>

            {activeRole ?
            <span className="text-xl">{activeRole.emoji}</span> :

            <TargetIcon className="w-5 h-5" />
            }
          </div>
          <div className="text-left">
            <div className="text-xs font-bold text-warm-800/50 uppercase tracking-wider mb-0.5">
              Current Focus
            </div>
            <div className="font-semibold text-warm-900">
              {activeRole ? activeRole.name : isFirstRun ? 'Pick a focus to guide your log' : 'No focus set'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-warm-800/60 font-medium text-sm bg-warm-50 px-3 py-1.5 rounded-full">
          Switch
          <ChevronDownIcon
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />

        </div>
      </button>

      <AnimatePresence>
        {isOpen &&
        <>
            <motion.div
            initial={{
              opacity: 0
            }}
            animate={{
              opacity: 1
            }}
            exit={{
              opacity: 0
            }}
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)} />

            <motion.div
            initial={{
              opacity: 0,
              y: -10,
              scale: 0.95
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1
            }}
            exit={{
              opacity: 0,
              y: -10,
              scale: 0.95
            }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-warm-lg border border-warm-200 overflow-hidden z-50 p-2">

              <div className="text-xs font-bold text-warm-800/50 uppercase tracking-wider px-3 py-2">
                Switch Focus To...
              </div>
              <div className="space-y-1">
                {roles.
              filter((r) => r.id !== activeRole?.id).
              map((role) => {
                const color = PRESET_COLORS[role.color];
                return (
                  <button
                    key={role.id}
                    onClick={() => {
                      onSwitchRole(role);
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-warm-50 transition-colors text-left">

                        <span
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                      style={{
                        backgroundColor: `${color}20`
                      }}>

                          {role.emoji}
                        </span>
                        <span className="font-medium text-warm-900 flex items-center gap-1.5">
                          {role.name}
                          {role.aspirational &&
                      <SparklesIcon className="w-3.5 h-3.5 text-amber-400" />
                      }
                        </span>
                      </button>);

              })}

                {activeRole && onClearFocus &&
              <>
                    <div className="border-t border-warm-200 my-1" />
                    <button
                  onClick={() => {
                    onClearFocus();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-warm-50 transition-colors text-left">

                      <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm bg-warm-100">
                        <TargetIcon className="w-4 h-4 text-warm-800/40" />
                      </span>
                      <span className="font-medium text-warm-800/60">
                        Unfocus
                      </span>
                    </button>
                  </>
              }
              </div>
            </motion.div>
          </>
        }
      </AnimatePresence>
    </div>);

}
import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, SparklesIcon } from 'lucide-react';
import { Role, Activity, ActivityTemplate } from '../types';
import { generateId } from '../utils/roleUtils';
import { RoleChip } from './RoleChip';
// ── Draggable template row ─────────────────────────────────────────────────────
function DraggableTemplateRow({
  templates,
  activeTemplateId,
  onApply,
}: {
  templates: ActivityTemplate[];
  activeTemplateId: string | null;
  onApply: (tpl: ActivityTemplate) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [dragLeft, setDragLeft] = useState(0);

  useEffect(() => {
    const measure = () => {
      const track = trackRef.current?.offsetWidth ?? 0;
      const inner = innerRef.current?.scrollWidth ?? 0;
      setDragLeft(Math.min(0, track - inner));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [templates.length]);

  return (
    <div className="mb-5">
      <p className="text-xs font-semibold text-warm-800/40 uppercase tracking-wider mb-2">
        Quick log
      </p>
      <div ref={trackRef} className="overflow-hidden cursor-grab active:cursor-grabbing">
        <motion.div
          ref={innerRef}
          drag="x"
          dragConstraints={{ left: dragLeft, right: 0 }}
          dragElastic={0.08}
          dragMomentum={true}
          className="flex gap-2 w-max pb-1"
        >
          {templates.map((tpl) => {
            const active = activeTemplateId === tpl.id;
            return (
              <motion.button
                key={tpl.id}
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => onApply(tpl)}
                whileTap={{ scale: 0.94 }}
                className={`px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap flex-shrink-0 transition-colors select-none ${
                  active
                    ? 'bg-warm-900 text-white'
                    : 'bg-warm-100 text-warm-800 hover:bg-warm-200'
                }`}
              >
                {tpl.name}
              </motion.button>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  roles: Role[];
  activityTemplates?: ActivityTemplate[];
  onAddActivity: (activity: Activity) => void;
  initialTimestamp?: number;
}
export function QuickAddModal({
  isOpen,
  onClose,
  roles,
  activityTemplates = [],
  onAddActivity,
  initialTimestamp
}: QuickAddModalProps) {
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [duration, setDuration] = useState<number>(30);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setName('');
      setNote('');
      setDuration(30);
      setSelectedRoleIds([]);
      setActiveTemplateId(null);
    }
  }, [isOpen]);

  const applyTemplate = (tpl: ActivityTemplate) => {
    if (activeTemplateId === tpl.id) {
      // Tap again to deselect
      setActiveTemplateId(null);
      setName('');
      setDuration(30);
      setSelectedRoleIds([]);
      return;
    }
    setActiveTemplateId(tpl.id);
    setName(tpl.name);
    setDuration(tpl.duration);
    // Only pre-select roles that still exist
    setSelectedRoleIds(tpl.roleIds.filter((id) => roles.some((r) => r.id === id)));
    inputRef.current?.focus();
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || selectedRoleIds.length === 0) return;
    onAddActivity({
      id: generateId(),
      name: name.trim(),
      roleIds: selectedRoleIds,
      timestamp: initialTimestamp || Date.now(),
      duration: duration,
      note: note.trim() || undefined
    });
    onClose();
  };
  const toggleRole = (id: string) => {
    setSelectedRoleIds((prev) =>
    prev.includes(id) ? prev.filter((rId) => rId !== id) : [...prev, id]
    );
  };
  return (
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
          onClick={onClose}
          className="fixed inset-0 bg-warm-900/20 backdrop-blur-sm z-40" />

          <motion.div
          initial={{
            y: '100%'
          }}
          animate={{
            y: 0
          }}
          exit={{
            y: '100%'
          }}
          transition={{
            type: 'spring',
            damping: 25,
            stiffness: 200
          }}
          className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-50 max-h-[90vh] overflow-y-auto">

            <div className="p-6 max-w-lg mx-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-warm-900 flex items-center gap-2">
                  <SparklesIcon className="w-5 h-5 text-role-amber" />
                  Log Activity
                </h2>
                <button
                onClick={onClose}
                className="p-2 bg-warm-100 rounded-full hover:bg-warm-200 transition-colors">

                  <XIcon className="w-5 h-5 text-warm-800" />
                </button>
              </div>

              {/* ── Templates row ───────────────────────── */}
              {activityTemplates.length > 0 && (
                <DraggableTemplateRow
                  templates={activityTemplates}
                  activeTemplateId={activeTemplateId}
                  onApply={applyTemplate}
                />
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <input
                  ref={inputRef}
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    // Deselect template if user edits name manually
                    if (activeTemplateId) setActiveTemplateId(null);
                  }}
                  placeholder="What are you doing?"
                  className="w-full text-2xl font-medium bg-transparent border-none outline-none placeholder:text-warm-300 text-warm-900" />

                </div>

                <div>
                  <label className="block text-sm font-medium text-warm-800/60 mb-3">
                    How long?
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {[15, 30, 60, 90, 120].map((mins) =>
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDuration(mins)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${duration === mins ? 'bg-warm-900 text-white' : 'bg-warm-100 text-warm-800 hover:bg-warm-200'}`}>

                        {mins < 60 ?
                    `${mins}m` :
                    mins === 60 ?
                    '1h' :
                    mins === 90 ?
                    '1.5h' :
                    '2h'}
                      </button>
                  )}
                    <div className="flex items-center bg-warm-100 rounded-full px-3 py-1.5 focus-within:ring-2 focus-within:ring-warm-300">
                      <input
                      type="number"
                      min="1"
                      value={duration}
                      onChange={(e) =>
                      setDuration(parseInt(e.target.value) || 0)
                      }
                      className="w-12 bg-transparent border-none outline-none text-sm font-medium text-warm-900 text-center" />

                      <span className="text-sm font-medium text-warm-800/60 ml-1">
                        min
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-warm-800/60 mb-3">
                    Which roles does this serve?
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {roles.map((role) =>
                  <RoleChip
                    key={role.id}
                    role={role}
                    selected={selectedRoleIds.includes(role.id)}
                    showEmoji={false}
                    onClick={toggleRole} />

                  )}
                  </div>
                </div>

                <div>
                  <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add a note (optional)..."
                  rows={2}
                  className="w-full bg-warm-50 border border-warm-200 rounded-xl p-4 outline-none focus:ring-2 focus:ring-warm-300 transition-all resize-none text-warm-900 placeholder:text-warm-800/40" />

                </div>

                <button
                type="submit"
                disabled={!name.trim() || selectedRoleIds.length === 0}
                className="w-full py-4 bg-warm-900 text-white rounded-xl font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-warm-800 transition-colors shadow-warm">

                  Log to Flow
                </button>
              </form>
            </div>
          </motion.div>
        </>
      }
    </AnimatePresence>);

}
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRightIcon, CheckIcon, PlusIcon, XIcon } from 'lucide-react';
import { Role, RoleColor, PRESET_COLORS, COMMON_EMOJIS } from '../types';
import { generateId } from '../utils/roleUtils';

// ─── Role suggestions ──────────────────────────────────────────────────────────
const ROLE_SUGGESTIONS = [
  { name: 'Professional', emoji: '💼', color: 'sky' as RoleColor,      desc: 'Work & career' },
  { name: 'Parent',       emoji: '👨‍👧‍👦', color: 'amber' as RoleColor,   desc: 'Raising family' },
  { name: 'Partner',      emoji: '❤️',  color: 'coral' as RoleColor,   desc: 'Your relationship' },
  { name: 'Friend',       emoji: '🤝',  color: 'sage' as RoleColor,    desc: 'Social connections' },
  { name: 'Athlete',      emoji: '🏃',  color: 'mint' as RoleColor,    desc: 'Health & fitness' },
  { name: 'Creative',     emoji: '🎨',  color: 'lavender' as RoleColor,desc: 'Making things' },
  { name: 'Learner',      emoji: '📚',  color: 'sky' as RoleColor,     desc: 'Growth & study' },
  { name: 'Caregiver',    emoji: '🌱',  color: 'sage' as RoleColor,    desc: 'Supporting others' },
  { name: 'Leader',       emoji: '🎯',  color: 'coral' as RoleColor,   desc: 'Guiding a team' },
  { name: 'Community',    emoji: '🏠',  color: 'amber' as RoleColor,   desc: 'Local ties' },
];

const COLOR_CYCLE: RoleColor[] = ['coral', 'sky', 'sage', 'lavender', 'amber', 'mint'];

// ─── Mini donut preview (step 3) ───────────────────────────────────────────────
function MiniDonut({ roles }: { roles: Role[] }) {
  const SIZE = 220;
  const CX = SIZE / 2;
  const CY = SIZE / 2;
  const OUTER_R = 88;
  const INNER_R = 52;
  const GAP = roles.length <= 1 ? 0 : 0.05;

  const polar = (r: number, a: number) => ({
    x: CX + r * Math.cos(a),
    y: CY + r * Math.sin(a),
  });

  const arc = (start: number, end: number) => {
    const oS = polar(OUTER_R, start); const oE = polar(OUTER_R, end);
    const iS = polar(INNER_R, start); const iE = polar(INNER_R, end);
    const lg = end - start > Math.PI ? 1 : 0;
    return [
      `M ${oS.x.toFixed(2)} ${oS.y.toFixed(2)}`,
      `A ${OUTER_R} ${OUTER_R} 0 ${lg} 1 ${oE.x.toFixed(2)} ${oE.y.toFixed(2)}`,
      `L ${iE.x.toFixed(2)} ${iE.y.toFixed(2)}`,
      `A ${INNER_R} ${INNER_R} 0 ${lg} 0 ${iS.x.toFixed(2)} ${iS.y.toFixed(2)}`,
      'Z',
    ].join(' ');
  };

  let angle = -Math.PI / 2;
  const segments = roles.map((role, idx) => {
    const span = (Math.PI * 2) / roles.length - GAP;
    const start = angle + GAP / 2;
    const end = start + span;
    angle += (Math.PI * 2) / roles.length;
    return { role, path: arc(start, end), color: PRESET_COLORS[role.color], idx };
  });

  return (
    <div className="relative" style={{ width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        {segments.map(({ role, path, color, idx }) => (
          <motion.path
            key={role.id}
            d={path}
            fill={`${color}CC`}
            stroke="white"
            strokeWidth={3}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: idx * 0.1, duration: 0.35, ease: 'easeOut' }}
          />
        ))}
      </svg>
      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
          className="text-center"
        >
          <div className="text-3xl font-bold text-warm-900 leading-none">{roles.length}</div>
          <div className="text-xs text-warm-800/45 mt-1 leading-tight">
            roles in<br />your life
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Page component ─────────────────────────────────────────────────────────────
interface OnboardingPageProps {
  roles: Role[];
  onAddRole: (role: Role) => void;
  onRemoveRole: (id: string) => void;
  onUpdateRole: (id: string, updates: Partial<Role>) => void;
  onComplete: () => void;
  onCompleteAndLog?: () => void;
}

export function OnboardingPage({
  roles,
  onAddRole,
  onRemoveRole,
  onComplete,
  onCompleteAndLog,
}: OnboardingPageProps) {
  const [step, setStep] = useState(1);
  const [customExpanded, setCustomExpanded] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEmoji, setCustomEmoji] = useState('💡');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const slideVariants = {
    enter: { x: 60, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -60, opacity: 0 },
  };

  const getNextColor = (): RoleColor => {
    const used = new Set(roles.map((r) => r.color));
    return COLOR_CYCLE.find((c) => !used.has(c)) ?? COLOR_CYCLE[roles.length % COLOR_CYCLE.length];
  };

  const toggleSuggestion = (s: (typeof ROLE_SUGGESTIONS)[0]) => {
    const existing = roles.find((r) => r.name === s.name);
    if (existing) { onRemoveRole(existing.id); return; }
    if (roles.length >= 6) return;
    const used = new Set(roles.map((r) => r.color));
    const color = !used.has(s.color) ? s.color : getNextColor();
    onAddRole({
      id: generateId(), name: s.name, emoji: s.emoji, color,
      createdAt: Date.now(), motivation: `Being a great ${s.name.toLowerCase()}`,
    });
  };

  const addCustomRole = () => {
    if (!customName.trim() || roles.length >= 6) return;
    onAddRole({
      id: generateId(), name: customName.trim(), emoji: customEmoji,
      color: getNextColor(), createdAt: Date.now(),
      motivation: `Being a great ${customName.trim().toLowerCase()}`,
    });
    setCustomName(''); setCustomEmoji('💡'); setCustomExpanded(false);
  };

  const isSuggestionAdded = (name: string) => roles.some((r) => r.name === name);

  return (
    <div className="min-h-screen flex flex-col p-6 max-w-md mx-auto">
      {/* Progress pills */}
      <div className="flex gap-2 pt-6 pb-10 justify-center">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            animate={{ width: step === i ? 24 : 8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className={`h-2 rounded-full transition-colors duration-300 ${
              step >= i ? 'bg-warm-900' : 'bg-warm-200'
            }`}
          />
        ))}
      </div>

      <div className="flex-1 relative">
        <AnimatePresence mode="wait">

          {/* ── Step 1: Welcome ─────────────────────────────────── */}
          {step === 1 && (
            <motion.div
              key="step1"
              variants={slideVariants}
              initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.28, ease: 'easeInOut' }}
              className="flex flex-col items-center text-center justify-center min-h-[70vh]"
            >
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 180 }}
                className="w-32 h-32 bg-white rounded-full shadow-warm-lg flex items-center justify-center mb-8 relative"
              >
                <div className="absolute w-20 h-20 bg-role-coral/20 rounded-full mix-blend-multiply -translate-x-4 -translate-y-2" />
                <div className="absolute w-20 h-20 bg-role-sky/20  rounded-full mix-blend-multiply  translate-x-4 -translate-y-2" />
                <div className="absolute w-20 h-20 bg-role-amber/20 rounded-full mix-blend-multiply translate-y-6" />
                <span className="text-4xl relative z-10">🌊</span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <h1 className="text-4xl font-bold text-warm-900 mb-4">Role Flow</h1>
                <p className="text-lg text-warm-800/65 mb-12 max-w-xs mx-auto leading-relaxed">
                  See how your time flows across all the roles that make up your life.
                </p>
              </motion.div>

              <motion.button
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                onClick={() => setStep(2)}
                className="w-full py-4 bg-warm-900 text-white rounded-xl font-medium text-lg flex items-center justify-center gap-2 hover:bg-warm-800 transition-colors shadow-warm"
              >
                Get Started
                <ChevronRightIcon className="w-5 h-5" />
              </motion.button>
            </motion.div>
          )}

          {/* ── Step 2: Pick roles ──────────────────────────────── */}
          {step === 2 && (
            <motion.div
              key="step2"
              variants={slideVariants}
              initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.28, ease: 'easeInOut' }}
              className="flex flex-col"
            >
              <div className="text-center mb-5">
                <h2 className="text-2xl font-bold text-warm-900 mb-2">
                  What roles make up your life?
                </h2>
                <p className="text-warm-800/55 text-sm">
                  Tap to add — pick up to 6. You can edit anytime.
                </p>
              </div>

              {/* Role count pill */}
              <AnimatePresence>
                {roles.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    className="flex items-center justify-center gap-2 overflow-hidden"
                  >
                    <div className="flex -space-x-1.5">
                      {roles.map((r) => (
                        <div
                          key={r.id}
                          className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-sm"
                          style={{ backgroundColor: `${PRESET_COLORS[r.color]}30` }}
                        >
                          {r.emoji}
                        </div>
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-warm-800/60">
                      {roles.length} / 6
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Suggestion grid */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                {ROLE_SUGGESTIONS.map((suggestion, idx) => {
                  const added = isSuggestionAdded(suggestion.name);
                  const disabled = !added && roles.length >= 6;
                  const color = PRESET_COLORS[suggestion.color];
                  return (
                    <motion.button
                      key={suggestion.name}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      onClick={() => !disabled && toggleSuggestion(suggestion)}
                      className={`flex items-center gap-3 p-3 rounded-2xl text-left border-2 transition-all ${
                        added
                          ? 'shadow-sm'
                          : disabled
                          ? 'border-transparent bg-warm-100/40 opacity-35 cursor-not-allowed'
                          : 'border-transparent bg-white hover:bg-warm-50 active:scale-95'
                      }`}
                      style={added ? { backgroundColor: `${color}15`, borderColor: color } : {}}
                    >
                      <span className="text-xl flex-shrink-0 leading-none w-7 text-center">
                        {suggestion.emoji}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-warm-900 text-sm leading-snug">
                          {suggestion.name}
                        </div>
                        <div className="text-[11px] text-warm-800/45 leading-tight">
                          {suggestion.desc}
                        </div>
                      </div>
                      <AnimatePresence>
                        {added && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: color }}
                          >
                            <CheckIcon className="w-3 h-3 text-white" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  );
                })}
              </div>

              {/* Custom role input */}
              <div className="mb-5">
                <AnimatePresence mode="wait">
                  {!customExpanded ? (
                    <motion.button
                      key="expand-btn"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => roles.length < 6 && setCustomExpanded(true)}
                      disabled={roles.length >= 6}
                      className="w-full py-3 border-2 border-dashed border-warm-300 rounded-2xl text-sm font-medium text-warm-800/50 hover:border-warm-400 hover:text-warm-800/70 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <PlusIcon className="w-4 h-4" />
                      Add something else
                    </motion.button>
                  ) : (
                    <motion.div
                      key="custom-form"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="bg-white border-2 border-warm-200 rounded-2xl p-3"
                    >
                      <div className="flex gap-2 items-center">
                        {/* Emoji picker */}
                        <div className="relative flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className="w-11 h-11 bg-warm-100 rounded-xl flex items-center justify-center text-xl hover:bg-warm-200 transition-colors"
                          >
                            {customEmoji}
                          </button>
                          <AnimatePresence>
                            {showEmojiPicker && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: -4 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="absolute top-12 left-0 bg-white border border-warm-200 rounded-2xl shadow-warm-lg p-3 grid grid-cols-5 gap-1 z-20 w-52"
                              >
                                {COMMON_EMOJIS.map((e) => (
                                  <button
                                    key={e}
                                    type="button"
                                    onClick={() => { setCustomEmoji(e); setShowEmojiPicker(false); }}
                                    className="w-8 h-8 flex items-center justify-center text-lg hover:bg-warm-100 rounded-lg transition-colors"
                                  >
                                    {e}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <input
                          autoFocus
                          type="text"
                          value={customName}
                          onChange={(e) => setCustomName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && addCustomRole()}
                          placeholder="Role name..."
                          maxLength={20}
                          className="flex-1 bg-warm-100 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-warm-300 placeholder:text-warm-800/35"
                        />

                        <button
                          type="button"
                          onClick={addCustomRole}
                          disabled={!customName.trim()}
                          className="w-11 h-11 bg-warm-900 text-white rounded-xl flex items-center justify-center disabled:opacity-35 hover:bg-warm-800 transition-colors flex-shrink-0"
                        >
                          <PlusIcon className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => { setCustomExpanded(false); setCustomName(''); }}
                          className="w-11 h-11 bg-warm-100 rounded-xl flex items-center justify-center hover:bg-warm-200 transition-colors flex-shrink-0"
                        >
                          <XIcon className="w-4 h-4 text-warm-800/50" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Continue */}
              <button
                onClick={() => setStep(3)}
                disabled={roles.length < 2}
                className="w-full py-4 bg-warm-900 text-white rounded-xl font-medium text-lg flex items-center justify-center gap-2 disabled:opacity-35 disabled:cursor-not-allowed hover:bg-warm-800 transition-colors shadow-warm"
              >
                Continue
                <ChevronRightIcon className="w-5 h-5" />
              </button>

              {roles.length < 2 && (
                <p className="text-center text-xs text-warm-800/35 mt-2">
                  Add at least 2 roles to continue
                </p>
              )}
            </motion.div>
          )}

          {/* ── Step 3: Your life at a glance ───────────────────── */}
          {step === 3 && (
            <motion.div
              key="step3"
              variants={slideVariants}
              initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.28, ease: 'easeInOut' }}
              className="flex flex-col items-center text-center justify-center min-h-[70vh]"
            >
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
              >
                <h2 className="text-2xl font-bold text-warm-900 mb-2">Your life, whole</h2>
                <p className="text-warm-800/55 text-sm mb-8 max-w-xs mx-auto leading-relaxed">
                  Each slice is a role. Log time and watch them shift to reflect how you actually live.
                </p>
              </motion.div>

              {/* Donut */}
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15, type: 'spring', stiffness: 160, damping: 18 }}
                className="mb-6"
              >
                <MiniDonut roles={roles} />
              </motion.div>

              {/* Role pills */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex flex-wrap gap-2 justify-center mb-10 max-w-xs"
              >
                {roles.map((role) => {
                  const color = PRESET_COLORS[role.color];
                  return (
                    <span
                      key={role.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
                      style={{ backgroundColor: `${color}20`, color }}
                    >
                      {role.emoji} {role.name}
                    </span>
                  );
                })}
              </motion.div>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="w-full space-y-3"
              >
                <button
                  onClick={onCompleteAndLog ?? onComplete}
                  className="w-full py-4 bg-warm-900 text-white rounded-xl font-medium text-lg flex items-center justify-center gap-2 hover:bg-warm-800 transition-colors shadow-warm"
                >
                  Log your first moment
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={onComplete}
                  className="w-full py-3 text-warm-800/50 text-sm font-medium hover:text-warm-800/80 transition-colors"
                >
                  Explore the app first
                </button>
              </motion.div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}

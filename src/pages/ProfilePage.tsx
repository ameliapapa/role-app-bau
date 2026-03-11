import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PauseIcon,
  PlayIcon,
  TrashIcon,
  PlusIcon,
  SettingsIcon,
  TargetIcon,
  SparklesIcon,
  LayoutTemplateIcon,
  ShieldIcon,
  DownloadIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  XIcon,
  PencilIcon,
  CheckIcon } from
'lucide-react';
import {
  Role,
  RoleColor,
  PRESET_COLORS,
  COMMON_EMOJIS,
  Activity,
  ActivityTemplate,
  TransitionSettings,
  RoleBalanceGoal } from
'../types';
import { generateId, formatDuration } from '../utils/roleUtils';
interface ProfilePageProps {
  roles: Role[];
  activities: Activity[];
  onAddRole: (role: Role) => void;
  onRemoveRole: (id: string) => void;
  onTogglePause: (id: string) => void;
  roleBalanceGoals: RoleBalanceGoal[];
  onSetRoleBalanceGoals: (goals: RoleBalanceGoal[]) => void;
  transitionSettings: TransitionSettings;
  onUpdateTransitionSettings: (updates: Partial<TransitionSettings>) => void;
  activityTemplates: ActivityTemplate[];
  onAddActivityTemplate: (template: ActivityTemplate) => void;
  onRemoveActivityTemplate: (id: string) => void;
  onUpdateRole: (id: string, updates: Partial<Role>) => void;
  onClearActivityHistory: () => void;
  onExportData: () => void;
}
type Section = 'roles' | 'balance' | 'rituals' | 'templates' | 'privacy';
export function ProfilePage({
  roles,
  activities,
  onAddRole,
  onRemoveRole,
  onUpdateRole,
  onTogglePause,
  roleBalanceGoals,
  onSetRoleBalanceGoals,
  transitionSettings,
  onUpdateTransitionSettings,
  activityTemplates,
  onAddActivityTemplate,
  onRemoveActivityTemplate,
  onClearActivityHistory,
  onExportData
}: ProfilePageProps) {
  const [activeSection, setActiveSection] = useState<Section>('roles');
  // Role Management State
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [motivation, setMotivation] = useState('');
  const [emoji, setEmoji] = useState(COMMON_EMOJIS[0]);
  const [color, setColor] = useState<RoleColor>('coral');
  const [showEmojis, setShowEmojis] = useState(false);
  // Role edit state
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editMotivation, setEditMotivation] = useState('');
  const [editEmoji, setEditEmoji] = useState(COMMON_EMOJIS[0]);
  const [editColor, setEditColor] = useState<RoleColor>('coral');
  const [showEditEmojis, setShowEditEmojis] = useState(false);
  // Template form state
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateEmoji, setTemplateEmoji] = useState('📋');
  const [templateDuration, setTemplateDuration] = useState(30);
  // Custom prompt input
  const [newPrompt, setNewPrompt] = useState('');
  const handleAddRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddRole({
      id: generateId(),
      name: name.trim(),
      emoji,
      color,
      createdAt: Date.now(),
      motivation: motivation.trim() || `Being a great ${name.trim()}`
    });
    setName('');
    setMotivation('');
    setIsAdding(false);
  };
  const startEditing = (role: Role) => {
    setEditingRoleId(role.id);
    setEditName(role.name);
    setEditMotivation(role.motivation || '');
    setEditEmoji(role.emoji);
    setEditColor(role.color);
    setShowEditEmojis(false);
  };
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editingRoleId) return;
    onUpdateRole(editingRoleId, {
      name: editName.trim(),
      motivation: editMotivation.trim() || `Being a great ${editName.trim()}`,
      emoji: editEmoji,
      color: editColor,
    });
    setEditingRoleId(null);
  };
  const handleAddTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim()) return;
    onAddActivityTemplate({
      id: generateId(),
      name: templateName.trim(),
      emoji: templateEmoji,
      roleIds: [],
      duration: templateDuration
    });
    setTemplateName('');
    setTemplateEmoji('📋');
    setTemplateDuration(30);
    setIsAddingTemplate(false);
  };
  const activeRoles = roles.filter((r) => !r.paused);
  // Compute balance percentages
  const getBalancePercent = (roleId: string) => {
    const goal = roleBalanceGoals.find((g) => g.roleId === roleId);
    if (goal) return goal.targetPercent;
    return activeRoles.length > 0 ? Math.floor(100 / activeRoles.length) : 0;
  };
  const handleBalanceChange = (roleId: string, value: number) => {
    const existing = roleBalanceGoals.filter((g) => g.roleId !== roleId);
    onSetRoleBalanceGoals([
    ...existing,
    {
      roleId,
      targetPercent: value
    }]
    );
  };
  const handleAddPrompt = () => {
    if (!newPrompt.trim()) return;
    onUpdateTransitionSettings({
      customPrompts: [...transitionSettings.customPrompts, newPrompt.trim()]
    });
    setNewPrompt('');
  };
  const handleRemovePrompt = (index: number) => {
    onUpdateTransitionSettings({
      customPrompts: transitionSettings.customPrompts.filter(
        (_, i) => i !== index
      )
    });
  };
  const SectionHeader = ({
    id,
    title,
    icon: Icon,
    description





  }: {id: Section;title: string;icon: any;description: string;}) => {
    const isActive = activeSection === id;
    return (
      <button
        onClick={() => setActiveSection(isActive ? 'roles' as Section : id)}
        className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${isActive ? 'bg-warm-900 text-white shadow-warm-lg' : 'bg-white text-warm-900 shadow-sm border border-warm-200 hover:bg-warm-50'}`}>

        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-xl ${isActive ? 'bg-white/20' : 'bg-warm-100'}`}>

            <Icon className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h2 className="font-bold text-lg leading-tight">{title}</h2>
            <p
              className={`text-xs ${isActive ? 'text-white/70' : 'text-warm-800/60'}`}>

              {description}
            </p>
          </div>
        </div>
        {isActive ?
        <ChevronUpIcon className="w-5 h-5 opacity-60" /> :

        <ChevronDownIcon className="w-5 h-5 opacity-60" />
        }
      </button>);

  };
  return (
    <div className="min-h-screen pb-28 pt-8 px-4 max-w-lg mx-auto">
      <header className="mb-8 px-2">
        <h1 className="text-3xl font-bold text-warm-900 mb-2">Settings</h1>
        <p className="text-warm-800/60">
          Customize your flow and manage your data.
        </p>
      </header>

      <div className="space-y-4">
        {/* 1. ROLE MANAGEMENT */}
        <div>
          <SectionHeader
            id="roles"
            title="Role Management"
            icon={SettingsIcon}
            description="Add, pause, or delete your roles" />

          <AnimatePresence>
            {activeSection === 'roles' &&
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
              className="overflow-hidden">

                <div className="pt-4 space-y-4">
                  {roles.map((role) => {
                  const roleColor = PRESET_COLORS[role.color];
                  const isPaused = role.paused;
                  const isEditing = editingRoleId === role.id;
                  return (
                    <div
                      key={role.id}
                      className={`bg-white rounded-2xl shadow-sm border transition-all ${isPaused && !isEditing ? 'border-warm-200 opacity-60 grayscale-[0.5]' : 'border-warm-200'}`}>

                      {isEditing ? (
                        <form onSubmit={handleSaveEdit} className="p-4">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-warm-900">Edit Role</h3>
                            <button
                              type="button"
                              onClick={() => setEditingRoleId(null)}
                              className="text-sm font-medium text-warm-800/60 hover:text-warm-900">
                              Cancel
                            </button>
                          </div>
                          <div className="flex gap-3 mb-4">
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setShowEditEmojis(!showEditEmojis)}
                                className="w-12 h-12 flex items-center justify-center text-2xl bg-warm-100 rounded-xl hover:bg-warm-200 transition-colors shrink-0">
                                {editEmoji}
                              </button>
                              {showEditEmojis &&
                                <div className="absolute top-14 left-0 bg-white p-3 rounded-2xl shadow-warm-lg border border-warm-200 grid grid-cols-5 gap-2 z-10 w-64">
                                  {COMMON_EMOJIS.map((e) =>
                                    <button
                                      key={e}
                                      type="button"
                                      onClick={() => { setEditEmoji(e); setShowEditEmojis(false); }}
                                      className="w-10 h-10 flex items-center justify-center text-xl hover:bg-warm-100 rounded-lg transition-colors">
                                      {e}
                                    </button>
                                  )}
                                </div>
                              }
                            </div>
                            <div className="flex-1 flex flex-col gap-2">
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                placeholder="Role name..."
                                className="w-full bg-warm-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-warm-300 transition-all placeholder:text-warm-800/40"
                                maxLength={20}
                                autoFocus />
                              <input
                                type="text"
                                value={editMotivation}
                                onChange={(e) => setEditMotivation(e.target.value)}
                                placeholder="Why does this matter?"
                                className="w-full bg-warm-50 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-warm-300 transition-all placeholder:text-warm-800/40 border border-warm-100"
                                maxLength={60} />
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mb-4">
                            {(Object.entries(PRESET_COLORS) as [RoleColor, string][]).map(([key, hex]) =>
                              <button
                                key={key}
                                type="button"
                                onClick={() => setEditColor(key)}
                                className={`w-8 h-8 rounded-full transition-transform ${editColor === key ? 'scale-110 ring-2 ring-offset-2 ring-warm-800' : 'hover:scale-110'}`}
                                style={{ backgroundColor: hex }} />
                            )}
                          </div>
                          <button
                            type="submit"
                            disabled={!editName.trim()}
                            className="w-full py-3.5 bg-warm-900 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-warm-800 transition-colors">
                            <CheckIcon className="w-4 h-4" /> Save Changes
                          </button>
                        </form>
                      ) : (
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shrink-0"
                                style={{ backgroundColor: `${roleColor}20` }}>
                                {role.emoji}
                              </div>
                              <div>
                                <h3 className="font-bold text-warm-900 text-lg flex items-center gap-2">
                                  {role.name}
                                  {isPaused &&
                                    <span className="text-[10px] uppercase tracking-wider font-bold bg-warm-200 text-warm-800 px-2 py-0.5 rounded-full">
                                      Paused
                                    </span>
                                  }
                                </h3>
                                <p className="text-sm text-warm-800/60 line-clamp-1">
                                  {role.motivation}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-warm-100">
                            <button
                              onClick={() => startEditing(role)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-warm-800 hover:bg-warm-100 transition-colors">
                              <PencilIcon className="w-4 h-4" /> Edit
                            </button>
                            <button
                              onClick={() => onTogglePause(role.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-warm-800 hover:bg-warm-100 transition-colors">
                              {isPaused ?
                                <><PlayIcon className="w-4 h-4" /> Resume</> :
                                <><PauseIcon className="w-4 h-4" /> Pause</>
                              }
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Delete ${role.name}? This removes it from all activities.`))
                                  onRemoveRole(role.id);
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                              <TrashIcon className="w-4 h-4" /> Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>);

                })}
                  {!isAdding ?
                <button
                  onClick={() => setIsAdding(true)}
                  className="w-full py-4 border-2 border-dashed border-warm-300 text-warm-800 rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-warm-50 hover:border-warm-400 transition-all">

                      <PlusIcon className="w-5 h-5" /> Add New Role
                    </button> :

                <form
                  onSubmit={handleAddRole}
                  className="bg-white p-5 rounded-3xl shadow-warm border border-warm-200">

                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-warm-900">New Role</h3>
                        <button
                      type="button"
                      onClick={() => setIsAdding(false)}
                      className="text-sm font-medium text-warm-800/60 hover:text-warm-900">

                          Cancel
                        </button>
                      </div>
                      <div className="flex gap-3 mb-4">
                        <div className="relative">
                          <button
                        type="button"
                        onClick={() => setShowEmojis(!showEmojis)}
                        className="w-12 h-12 flex items-center justify-center text-2xl bg-warm-100 rounded-xl hover:bg-warm-200 transition-colors shrink-0">

                            {emoji}
                          </button>
                          {showEmojis &&
                      <div className="absolute top-14 left-0 bg-white p-3 rounded-2xl shadow-warm-lg border border-warm-200 grid grid-cols-5 gap-2 z-10 w-64">
                              {COMMON_EMOJIS.map((e) =>
                        <button
                          key={e}
                          type="button"
                          onClick={() => {
                            setEmoji(e);
                            setShowEmojis(false);
                          }}
                          className="w-10 h-10 flex items-center justify-center text-xl hover:bg-warm-100 rounded-lg transition-colors">

                                  {e}
                                </button>
                        )}
                            </div>
                      }
                        </div>
                        <div className="flex-1 flex flex-col gap-2">
                          <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Parent, Work..."
                        className="w-full bg-warm-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-warm-300 transition-all placeholder:text-warm-800/40"
                        maxLength={20} />

                          <input
                        type="text"
                        value={motivation}
                        onChange={(e) => setMotivation(e.target.value)}
                        placeholder="Why does this matter?"
                        className="w-full bg-warm-50 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-warm-300 transition-all placeholder:text-warm-800/40 border border-warm-100"
                        maxLength={60} />

                        </div>
                      </div>
                      <div className="flex items-center gap-2 mb-6">
                        {(
                    Object.entries(PRESET_COLORS) as [RoleColor, string][]).
                    map(([key, hex]) =>
                    <button
                      key={key}
                      type="button"
                      onClick={() => setColor(key)}
                      className={`w-8 h-8 rounded-full transition-transform ${color === key ? 'scale-110 ring-2 ring-offset-2 ring-warm-800' : 'hover:scale-110'}`}
                      style={{
                        backgroundColor: hex
                      }} />

                    )}
                      </div>
                      <button
                    type="submit"
                    disabled={!name.trim()}
                    className="w-full py-3.5 bg-warm-900 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-warm-800 transition-colors">

                        <PlusIcon className="w-5 h-5" /> Save Role
                      </button>
                    </form>
                }
                </div>
              </motion.div>
            }
          </AnimatePresence>
        </div>

        {/* 2. ROLE BALANCE GOALS */}
        <div>
          <SectionHeader
            id="balance"
            title="Role Balance Goals"
            icon={TargetIcon}
            description="Set your intended life balance" />

          <AnimatePresence>
            {activeSection === 'balance' &&
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
              className="overflow-hidden">

                <div className="pt-4">
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-warm-200">
                    <p className="text-sm text-warm-800/60 mb-6">
                      Adjust sliders to set your ideal time distribution across
                      roles.
                    </p>

                    {/* Visual bar */}
                    <div className="h-3 bg-warm-100 rounded-full overflow-hidden flex mb-6">
                      {activeRoles.map((role) => {
                      const pct = getBalancePercent(role.id);
                      return (
                        <div
                          key={role.id}
                          className="h-full transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: PRESET_COLORS[role.color]
                          }} />);


                    })}
                    </div>

                    <div className="space-y-5">
                      {activeRoles.map((role) => {
                      const pct = getBalancePercent(role.id);
                      const roleColor = PRESET_COLORS[role.color];
                      return (
                        <div key={role.id}>
                            <div className="flex justify-between text-sm font-medium mb-2">
                              <span className="flex items-center gap-2">
                                <span>{role.emoji}</span> {role.name}
                              </span>
                              <span
                              style={{
                                color: roleColor
                              }}>

                                {pct}%
                              </span>
                            </div>
                            <input
                            type="range"
                            min={0}
                            max={100}
                            value={pct}
                            onChange={(e) =>
                            handleBalanceChange(
                              role.id,
                              parseInt(e.target.value)
                            )
                            }
                            className="w-full h-2 rounded-full appearance-none cursor-pointer"
                            style={{
                              accentColor: roleColor
                            }} />

                          </div>);

                    })}
                    </div>

                    <button
                    onClick={() => {
                      const equal = Math.floor(100 / activeRoles.length);
                      onSetRoleBalanceGoals(
                        activeRoles.map((r) => ({
                          roleId: r.id,
                          targetPercent: equal
                        }))
                      );
                    }}
                    className="mt-4 text-sm font-medium text-warm-800/60 hover:text-warm-900 transition-colors">

                      Reset to Equal
                    </button>
                  </div>
                </div>
              </motion.div>
            }
          </AnimatePresence>
        </div>

        {/* 3. TRANSITION RITUALS */}
        <div>
          <SectionHeader
            id="rituals"
            title="Transition Rituals"
            icon={SparklesIcon}
            description="Customize your focus shifts" />

          <AnimatePresence>
            {activeSection === 'rituals' &&
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
              className="overflow-hidden">

                <div className="pt-4 space-y-4">
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-warm-200">
                    {/* Ritual type selector */}
                    <h3 className="font-bold text-warm-900 mb-3 text-sm">
                      Ritual Type
                    </h3>
                    <div className="grid grid-cols-3 gap-2 mb-6">
                      {[
                    {
                      type: 'reflection' as const,
                      label: 'Reflection',
                      desc: 'Guided prompts'
                    },
                    {
                      type: 'breathing' as const,
                      label: 'Breathing',
                      desc: 'Brief pause'
                    },
                    {
                      type: 'quick' as const,
                      label: 'Quick',
                      desc: 'Instant switch'
                    }].
                    map(({ type, label, desc }) =>
                    <button
                      key={type}
                      onClick={() =>
                      onUpdateTransitionSettings({
                        ritualType: type
                      })
                      }
                      className={`p-3 rounded-xl text-center transition-all ${transitionSettings.ritualType === type ? 'bg-warm-900 text-white shadow-sm' : 'bg-warm-50 border border-warm-200 text-warm-800'}`}>

                          <div className="font-bold text-sm">{label}</div>
                          <div
                        className={`text-[10px] mt-0.5 ${transitionSettings.ritualType === type ? 'text-white/70' : 'text-warm-800/50'}`}>

                            {desc}
                          </div>
                        </button>
                    )}
                    </div>

                    {/* Suggestions toggle */}
                    <div className="flex items-center justify-between mb-6 pb-6 border-b border-warm-100">
                      <div>
                        <h3 className="font-bold text-warm-900 text-sm">
                          Show Suggestions
                        </h3>
                        <p className="text-xs text-warm-800/60 mt-0.5">
                          Display prompts when switching roles
                        </p>
                      </div>
                      <button
                      onClick={() =>
                      onUpdateTransitionSettings({
                        suggestionsEnabled:
                        !transitionSettings.suggestionsEnabled
                      })
                      }
                      className={`w-12 h-6 rounded-full transition-colors relative ${transitionSettings.suggestionsEnabled ? 'bg-warm-900' : 'bg-warm-200'}`}>

                        <div
                        className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${transitionSettings.suggestionsEnabled ? 'left-7' : 'left-1'}`} />

                      </button>
                    </div>

                    {/* Custom prompts */}
                    {transitionSettings.ritualType === 'reflection' &&
                  <div>
                        <h3 className="font-bold text-warm-900 mb-3 text-sm">
                          Personal Prompts
                        </h3>
                        <div className="space-y-2 mb-3">
                          {transitionSettings.customPrompts.map((prompt, i) =>
                      <div
                        key={i}
                        className="flex items-center gap-2 bg-warm-50 rounded-lg px-3 py-2">

                              <span className="text-sm text-warm-800 flex-1">
                                {prompt}
                              </span>
                              <button
                          onClick={() => handleRemovePrompt(i)}
                          className="text-warm-800/40 hover:text-red-500 transition-colors">

                                <XIcon className="w-4 h-4" />
                              </button>
                            </div>
                      )}
                        </div>
                        <div className="flex gap-2">
                          <input
                        type="text"
                        value={newPrompt}
                        onChange={(e) => setNewPrompt(e.target.value)}
                        onKeyDown={(e) =>
                        e.key === 'Enter' && handleAddPrompt()
                        }
                        placeholder="e.g., What am I grateful for?"
                        className="flex-1 bg-warm-50 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-warm-300 border border-warm-100" />

                          <button
                        onClick={handleAddPrompt}
                        disabled={!newPrompt.trim()}
                        className="px-3 py-2 bg-warm-900 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-warm-800 transition-colors">

                            Add
                          </button>
                        </div>
                      </div>
                  }
                  </div>
                </div>
              </motion.div>
            }
          </AnimatePresence>
        </div>

        {/* 4. ACTIVITY TEMPLATES */}
        <div>
          <SectionHeader
            id="templates"
            title="Activity Templates"
            icon={LayoutTemplateIcon}
            description="Quick-add frequent activities" />

          <AnimatePresence>
            {activeSection === 'templates' &&
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
              className="overflow-hidden">

                <div className="pt-4 space-y-3">
                  {activityTemplates.map((template) =>
                <div
                  key={template.id}
                  className="bg-white p-4 rounded-2xl shadow-sm border border-warm-200 flex items-center justify-between">

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-warm-100 rounded-full flex items-center justify-center text-lg">
                          {template.emoji}
                        </div>
                        <div>
                          <h3 className="font-bold text-warm-900">
                            {template.name}
                          </h3>
                          <p className="text-xs text-warm-800/60">
                            {formatDuration(template.duration)}
                          </p>
                        </div>
                      </div>
                      <button
                    onClick={() => onRemoveActivityTemplate(template.id)}
                    className="p-2 text-warm-800/40 hover:text-red-500 transition-colors">

                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                )}

                  {!isAddingTemplate ?
                <button
                  onClick={() => setIsAddingTemplate(true)}
                  className="w-full py-4 border-2 border-dashed border-warm-300 text-warm-800 rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-warm-50 transition-all">

                      <PlusIcon className="w-5 h-5" /> Create Template
                    </button> :

                <form
                  onSubmit={handleAddTemplate}
                  className="bg-white p-4 rounded-2xl shadow-sm border border-warm-200">

                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-warm-900 text-sm">
                          New Template
                        </h3>
                        <button
                      type="button"
                      onClick={() => setIsAddingTemplate(false)}
                      className="text-xs font-medium text-warm-800/60 hover:text-warm-900">

                          Cancel
                        </button>
                      </div>
                      <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Activity name..."
                    className="w-full bg-warm-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-warm-300 mb-3 placeholder:text-warm-800/40" />

                      <div className="flex flex-wrap gap-2 mb-3">
                        {[15, 30, 60, 90, 120].map((mins) =>
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setTemplateDuration(mins)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${templateDuration === mins ? 'bg-warm-900 text-white' : 'bg-warm-100 text-warm-800'}`}>

                            {formatDuration(mins)}
                          </button>
                    )}
                      </div>
                      <button
                    type="submit"
                    disabled={!templateName.trim()}
                    className="w-full py-3 bg-warm-900 text-white rounded-xl font-medium disabled:opacity-50 hover:bg-warm-800 transition-colors">

                        Save Template
                      </button>
                    </form>
                }
                </div>
              </motion.div>
            }
          </AnimatePresence>
        </div>

        {/* 5. DATA & PRIVACY */}
        <div>
          <SectionHeader
            id="privacy"
            title="Data & Privacy"
            icon={ShieldIcon}
            description="Export data and manage history" />

          <AnimatePresence>
            {activeSection === 'privacy' &&
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
              className="overflow-hidden">

                <div className="pt-4">
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-warm-200 space-y-6">
                    <div>
                      <h3 className="font-bold text-warm-900 mb-1">
                        Local Storage Only
                      </h3>
                      <p className="text-sm text-warm-800/60 mb-3">
                        Your data never leaves your device. Everything is stored
                        locally in your browser.
                      </p>
                      <div className="flex items-center gap-2 text-xs font-medium text-green-600 bg-green-50 px-3 py-2 rounded-lg inline-flex">
                        <ShieldIcon className="w-4 h-4" /> Fully Private
                      </div>
                    </div>

                    <div className="border-t border-warm-100 pt-6">
                      <h3 className="font-bold text-warm-900 mb-1">
                        Export Data
                      </h3>
                      <p className="text-sm text-warm-800/60 mb-3">
                        Download a JSON file with all your roles and activity
                        history.
                      </p>
                      <button
                      onClick={onExportData}
                      className="flex items-center gap-2 px-4 py-2 bg-warm-100 text-warm-900 rounded-xl font-medium hover:bg-warm-200 transition-colors text-sm">

                        <DownloadIcon className="w-4 h-4" /> Export JSON
                      </button>
                    </div>

                    <div className="border-t border-red-100 pt-6">
                      <h3 className="font-bold text-red-600 mb-1">
                        Danger Zone
                      </h3>
                      <p className="text-sm text-warm-800/60 mb-3">
                        Permanently delete all {activities.length} logged
                        activities. This cannot be undone.
                      </p>
                      <button
                      onClick={() => {
                        if (
                        window.confirm(
                          'Are you sure? This will permanently delete all activity history.'
                        ))
                        {
                          onClearActivityHistory();
                        }
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors text-sm">

                        <TrashIcon className="w-4 h-4" /> Delete Activity
                        History
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            }
          </AnimatePresence>
        </div>
      </div>
    </div>);

}
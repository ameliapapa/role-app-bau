import React, { useState } from 'react';
import { PlusIcon } from 'lucide-react';
import { Role, RoleColor, PRESET_COLORS, COMMON_EMOJIS } from '../types';
import { generateId } from '../utils/roleUtils';
import { RoleChip } from './RoleChip';
interface RoleSetupProps {
  roles: Role[];
  onAddRole: (role: Role) => void;
  onRemoveRole: (id: string) => void;
}
export function RoleSetup({ roles, onAddRole, onRemoveRole }: RoleSetupProps) {
  const [name, setName] = useState('');
  const [motivation, setMotivation] = useState('');
  const [emoji, setEmoji] = useState(COMMON_EMOJIS[0]);
  const [color, setColor] = useState<RoleColor>('coral');
  const [showEmojis, setShowEmojis] = useState(false);
  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || roles.length >= 6) return;
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
    // Pick next color automatically
    const colorKeys = Object.keys(PRESET_COLORS) as RoleColor[];
    const nextColorIndex = (colorKeys.indexOf(color) + 1) % colorKeys.length;
    setColor(colorKeys[nextColorIndex]);
    setShowEmojis(false);
  };
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-8 min-h-[100px]">
        {roles.length === 0 ?
        <div className="text-center p-6 border-2 border-dashed border-warm-300 rounded-2xl text-warm-800/60">
            No roles added yet. Add at least two to continue.
          </div> :

        <div className="flex flex-wrap gap-3">
            {roles.map((role) =>
          <RoleChip key={role.id} role={role} onRemove={onRemoveRole} />
          )}
          </div>
        }
      </div>

      <form
        onSubmit={handleAdd}
        className="bg-white p-5 rounded-3xl shadow-warm border border-warm-200">

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
              placeholder="e.g., Parent, Work, Health..."
              className="w-full bg-warm-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-warm-300 transition-all placeholder:text-warm-800/40"
              maxLength={20} />

            <input
              type="text"
              value={motivation}
              onChange={(e) => setMotivation(e.target.value)}
              placeholder="Why does this matter? (e.g. To raise kind humans)"
              className="w-full bg-warm-50 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-warm-300 transition-all placeholder:text-warm-800/40 border border-warm-100"
              maxLength={60} />

          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            {(Object.entries(PRESET_COLORS) as [RoleColor, string][]).map(
              ([key, hex]) =>
              <button
                key={key}
                type="button"
                onClick={() => setColor(key)}
                className={`w-8 h-8 rounded-full transition-transform ${color === key ? 'scale-110 ring-2 ring-offset-2 ring-warm-800' : 'hover:scale-110'}`}
                style={{
                  backgroundColor: hex
                }}
                aria-label={`Select ${key} color`} />


            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={!name.trim() || roles.length >= 6}
          className="w-full py-3.5 bg-warm-900 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-warm-800 transition-colors">

          <PlusIcon className="w-5 h-5" />
          Add Role
        </button>

        {roles.length >= 6 &&
        <p className="text-center text-xs text-warm-800/60 mt-3">
            Maximum of 6 roles reached.
          </p>
        }
      </form>
    </div>);

}
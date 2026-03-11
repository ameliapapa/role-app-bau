import React from 'react';
import { XIcon, SparklesIcon } from 'lucide-react';
import { Role, PRESET_COLORS } from '../types';
interface RoleChipProps {
  role: Role;
  onRemove?: (id: string) => void;
  onClick?: (id: string) => void;
  selected?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}
export function RoleChip({
  role,
  onRemove,
  onClick,
  selected = false,
  size = 'md',
  className = ''
}: RoleChipProps) {
  const baseColor = PRESET_COLORS[role.color];
  const isInteractive = !!onClick || !!onRemove;
  return (
    <div
      onClick={() => onClick?.(role.id)}
      className={`
        inline-flex items-center rounded-full transition-all duration-200
        ${size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-sm'}
        ${isInteractive && onClick ? 'cursor-pointer hover:scale-105 active:scale-95' : ''}
        ${selected ? 'ring-2 ring-offset-2 ring-warm-800' : ''}
        ${className}
      `}
      style={{
        backgroundColor: `${baseColor}25`,
        color: '#2D2D2A',
        border: `1px solid ${baseColor}40`
      }}>

      <span className="mr-1.5">{role.emoji}</span>
      <span className="font-medium">{role.name}</span>
      {role.aspirational &&
      <SparklesIcon
        className={`ml-1 text-amber-400 ${size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />

      }

      {onRemove &&
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(role.id);
        }}
        className="ml-2 p-0.5 rounded-full hover:bg-black/10 transition-colors"
        aria-label={`Remove ${role.name} role`}>

          <XIcon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
        </button>
      }
    </div>);

}
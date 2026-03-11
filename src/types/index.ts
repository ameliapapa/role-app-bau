export type RoleColor = 'coral' | 'sage' | 'sky' | 'lavender' | 'amber' | 'mint';

export type RoleGravity = 1 | 2 | 3 | 4 | 5;

export interface Role {
  id: string;
  name: string;
  emoji: string;
  color: RoleColor;
  createdAt: number;
  motivation?: string;
  paused?: boolean;
  aspirational?: boolean;
  gravity?: RoleGravity;
}

export interface Activity {
  id: string;
  name: string;
  roleIds: string[];
  timestamp: number;
  duration: number;
  note?: string;
}

export interface ActivityTemplate {
  id: string;
  name: string;
  emoji: string;
  roleIds: string[];
  duration: number;
}

export interface Reflection {
  id: string;
  type: 'daily' | 'weekly' | 'quarterly';
  timestamp: number; // Represents the period it belongs to
  answers: Record<string, string>; // prompt -> answer
}

export interface TransitionSettings {
  ritualType: 'reflection' | 'breathing' | 'quick';
  customPrompts: string[];
  suggestionsEnabled: boolean;
}

export interface RoleBalanceGoal {
  roleId: string;
  targetPercent: number;
}

export type ReflectionCadence = 'daily' | 'weekly' | 'quarterly';

export interface AppState {
  roles: Role[];
  activities: Activity[];
  onboardingComplete: boolean;
  activeRoleId?: string;
  activityTemplates: ActivityTemplate[];
  transitionSettings: TransitionSettings;
  roleBalanceGoals: RoleBalanceGoal[];
  reflections: Reflection[];
}

export const PRESET_COLORS: Record<RoleColor, string> = {
  coral: '#F4845F',
  sage: '#7CB69D',
  sky: '#6BB5E0',
  lavender: '#9B8EC4',
  amber: '#E8B960',
  mint: '#6DC5B2'
};

export const COMMON_EMOJIS = [
'💼',
'🏠',
'❤️',
'🏃‍♂️',
'📚',
'🎨',
'🧘‍♀️',
'👨‍👧‍👦',
'🎯',
'💡',
'🌱',
'🎵',
'🍳',
'✈️',
'🤝',
'💪',
'🎮',
'📱',
'🏋️',
'🐶'];


export type TimePeriod = 'day' | 'week' | 'quarter';
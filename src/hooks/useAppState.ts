import { useState, useEffect, useCallback } from 'react';
import {
  AppState,
  Role,
  Activity,
  ActivityTemplate,
  TransitionSettings,
  RoleBalanceGoal,
  Reflection } from
'../types';

const STORAGE_KEY = 'role-flow-state';

const defaultState: AppState = {
  roles: [],
  activities: [],
  onboardingComplete: false,
  activityTemplates: [
  {
    id: 'tpl-1',
    name: 'School Pickup',
    emoji: '🏫',
    roleIds: [],
    duration: 30
  },
  { id: 'tpl-2', name: 'Deep Work', emoji: '🧠', roleIds: [], duration: 120 },
  {
    id: 'tpl-3',
    name: 'Gym Session',
    emoji: '💪',
    roleIds: [],
    duration: 60
  },
  {
    id: 'tpl-4',
    name: 'Family Dinner',
    emoji: '🍽️',
    roleIds: [],
    duration: 60
  }],

  transitionSettings: {
    ritualType: 'reflection',
    customPrompts: [],
    suggestionsEnabled: true
  },
  roleBalanceGoals: [],
  reflections: []
};

export function useAppState() {
  const [state, setState] = useState<AppState>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : defaultState;
    } catch (e) {
      console.error('Failed to load state', e);
      return defaultState;
    }
  });

  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const addRole = useCallback((role: Role) => {
    setState((prev) => ({
      ...prev,
      roles: [...prev.roles, role]
    }));
  }, []);

  const updateRole = useCallback((roleId: string, updates: Partial<Role>) => {
    setState((prev) => ({
      ...prev,
      roles: prev.roles.map((r) =>
      r.id === roleId ? { ...r, ...updates } : r
      )
    }));
  }, []);

  const removeRole = useCallback((roleId: string) => {
    setState((prev) => ({
      ...prev,
      roles: prev.roles.filter((r) => r.id !== roleId),
      activities: prev.activities.
      map((a) => ({
        ...a,
        roleIds: a.roleIds.filter((id) => id !== roleId)
      })).
      filter((a) => a.roleIds.length > 0) // Remove activities that have no roles left
    }));
    setSelectedRoleIds((prev) => prev.filter((id) => id !== roleId));
  }, []);

  const togglePauseRole = useCallback((roleId: string) => {
    setState((prev) => ({
      ...prev,
      roles: prev.roles.map((r) =>
      r.id === roleId ? { ...r, paused: !r.paused } : r
      )
    }));
  }, []);

  const addActivity = useCallback((activity: Activity) => {
    setState((prev) => ({
      ...prev,
      activities: [activity, ...prev.activities]
    }));
  }, []);

  const removeActivity = useCallback((activityId: string) => {
    setState((prev) => ({
      ...prev,
      activities: prev.activities.filter((a) => a.id !== activityId)
    }));
  }, []);

  const completeOnboarding = useCallback(() => {
    setState((prev) => ({ ...prev, onboardingComplete: true }));
  }, []);

  const toggleRoleSelection = useCallback((roleId: string) => {
    setSelectedRoleIds((prev) => {
      if (prev.includes(roleId)) {
        return prev.filter((id) => id !== roleId);
      } else {
        return [...prev, roleId];
      }
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedRoleIds([]);
  }, []);

  const setActiveRole = useCallback((roleId: string | null) => {
    setState((prev) => ({
      ...prev,
      activeRoleId: roleId || undefined
    }));
  }, []);

  const setRoleBalanceGoals = useCallback((goals: RoleBalanceGoal[]) => {
    setState((prev) => ({ ...prev, roleBalanceGoals: goals }));
  }, []);

  const updateTransitionSettings = useCallback(
    (updates: Partial<TransitionSettings>) => {
      setState((prev) => ({
        ...prev,
        transitionSettings: { ...prev.transitionSettings, ...updates }
      }));
    },
    []
  );

  const addActivityTemplate = useCallback((template: ActivityTemplate) => {
    setState((prev) => ({
      ...prev,
      activityTemplates: [...prev.activityTemplates, template]
    }));
  }, []);

  const removeActivityTemplate = useCallback((templateId: string) => {
    setState((prev) => ({
      ...prev,
      activityTemplates: prev.activityTemplates.filter(
        (t) => t.id !== templateId
      )
    }));
  }, []);

  const clearActivityHistory = useCallback(() => {
    setState((prev) => ({ ...prev, activities: [] }));
  }, []);

  const saveReflection = useCallback((reflection: Reflection) => {
    setState((prev) => {
      // If a reflection for this exact timestamp and type exists, update it
      const existingIndex = prev.reflections.findIndex(
        (r) =>
        r.type === reflection.type && r.timestamp === reflection.timestamp
      );

      if (existingIndex >= 0) {
        const newReflections = [...prev.reflections];
        newReflections[existingIndex] = reflection;
        return { ...prev, reflections: newReflections };
      }

      return {
        ...prev,
        reflections: [...prev.reflections, reflection]
      };
    });
  }, []);

  const exportData = useCallback(() => {
    const data = JSON.stringify(state, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roleflow-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [state]);

  const resetOnboarding = useCallback(() => {
    setState(defaultState);
    setSelectedRoleIds([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    state,
    selectedRoleIds,
    addRole,
    updateRole,
    removeRole,
    togglePauseRole,
    addActivity,
    removeActivity,
    completeOnboarding,
    toggleRoleSelection,
    clearSelection,
    setSelectedRoleIds,
    setActiveRole,
    setRoleBalanceGoals,
    updateTransitionSettings,
    addActivityTemplate,
    removeActivityTemplate,
    clearActivityHistory,
    saveReflection,
    exportData,
    resetOnboarding
  };
}
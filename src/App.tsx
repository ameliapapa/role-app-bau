import React, { useEffect, useMemo, useState } from 'react';
import { useAppState } from './hooks/useAppState';
import { PRESET_COLORS } from './types';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { ReflectionPage } from './pages/ReflectionPage';
import { RoleOverviewPage } from './pages/RoleOverviewPage';
import { CalendarPage } from './pages/CalendarPage';
import { ProfilePage } from './pages/ProfilePage';
import { Navigation } from './components/Navigation';
import { QuickAddModal } from './components/QuickAddModal';
export function App() {
  const {
    state,
    selectedRoleIds,
    addRole,
    updateRole,
    removeRole,
    togglePauseRole,
    addActivity,
    removeActivity,
    completeOnboarding,
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
  } = useAppState();
  // Compute the active role's color for the ambient background tint
  const activeRole = useMemo(
    () => state.roles.find((r) => r.id === state.activeRoleId),
    [state.roles, state.activeRoleId]
  );
  const ambientColor = activeRole ? PRESET_COLORS[activeRole.color] : null;
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'calendar' | 'reflect' | 'profile'>(
    'dashboard');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddInitialTime, setQuickAddInitialTime] = useState<
    number | undefined>(
    undefined);
  const [viewingRoleId, setViewingRoleId] = useState<string | null>(null);
  // Filter out paused roles for the main flow
  const activeRoles = useMemo(
    () => state.roles.filter((r) => !r.paused),
    [state.roles]
  );

  if (!state.onboardingComplete) {
    return (
      <OnboardingPage
        roles={state.roles}
        onAddRole={addRole}
        onRemoveRole={removeRole}
        onUpdateRole={updateRole}
        onComplete={completeOnboarding}
        onCompleteAndLog={() => {
          completeOnboarding();
          setQuickAddInitialTime(undefined);
          setIsQuickAddOpen(true);
        }} />);


  }
  if (viewingRoleId) {
    const role = state.roles.find((r) => r.id === viewingRoleId);
    if (role) {
      return (
        <RoleOverviewPage
          role={role}
          roles={state.roles}
          activities={state.activities}
          onBack={() => setViewingRoleId(null)}
          onDeleteActivity={removeActivity} />);


    }
  }
  return (
    <div
      className="min-h-screen font-sans text-warm-900"
      style={{
        backgroundColor: ambientColor ?
        `color-mix(in srgb, ${ambientColor} 10%, #FAFAF7)` :
        '#FAFAF7',
        transition: 'background-color 0.8s ease'
      }}>

      {/* Subtle radial glow at top for depth */}
      {ambientColor &&
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${ambientColor}12 0%, transparent 70%)`,
          transition: 'background 0.8s ease'
        }} />

      }

      <div className="relative z-10">
        {activeTab === 'dashboard' ?
        <DashboardPage
          roles={activeRoles}
          activities={state.activities}
          selectedRoleIds={selectedRoleIds}
          activeRoleId={state.activeRoleId}
          onSelectionChange={setSelectedRoleIds}
          onDeleteActivity={removeActivity}
          onRoleTap={(id) => setViewingRoleId(id)}
          onSetActiveRole={setActiveRole}
          onOpenQuickAdd={() => {
            setQuickAddInitialTime(undefined);
            setIsQuickAddOpen(true);
          }} /> :

        activeTab === 'calendar' ?
        <CalendarPage
          roles={activeRoles}
          activities={state.activities}
          onOpenAddWithTime={(time) => {
            setQuickAddInitialTime(time);
            setIsQuickAddOpen(true);
          }} /> :

        activeTab === 'reflect' ?
        <ReflectionPage
          roles={state.roles}
          reflections={state.reflections}
          onSaveReflection={saveReflection} /> :


        <ProfilePage
          roles={state.roles}
          activities={state.activities}
          onAddRole={addRole}
          onRemoveRole={removeRole}
          onTogglePause={togglePauseRole}
          roleBalanceGoals={state.roleBalanceGoals}
          onSetRoleBalanceGoals={setRoleBalanceGoals}
          transitionSettings={state.transitionSettings}
          onUpdateTransitionSettings={updateTransitionSettings}
          activityTemplates={state.activityTemplates}
          onAddActivityTemplate={addActivityTemplate}
          onRemoveActivityTemplate={removeActivityTemplate}
          onClearActivityHistory={clearActivityHistory}
          onExportData={exportData} />

        }
      </div>

      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenAdd={() => {
          setQuickAddInitialTime(undefined);
          setIsQuickAddOpen(true);
        }} />


      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        roles={activeRoles}
        activityTemplates={state.activityTemplates}
        onAddActivity={addActivity}
        initialTimestamp={quickAddInitialTime} />

    </div>);

}
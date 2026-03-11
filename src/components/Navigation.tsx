import React from 'react';
import {
  HomeIcon,
  PlusIcon,
  BookOpenIcon,
  CalendarIcon,
  UserIcon } from
'lucide-react';
interface NavigationProps {
  activeTab: 'dashboard' | 'calendar' | 'reflect' | 'profile';
  onTabChange: (tab: 'dashboard' | 'calendar' | 'reflect' | 'profile') => void;
  onOpenAdd: () => void;
}
export function Navigation({
  activeTab,
  onTabChange,
  onOpenAdd
}: NavigationProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-warm-200 pb-safe z-30">
      <div className="max-w-md mx-auto px-6 h-20 flex items-center justify-between relative">
        <button
          onClick={() => onTabChange('dashboard')}
          className={`flex flex-col items-center justify-center w-12 h-full transition-colors ${activeTab === 'dashboard' ? 'text-warm-900' : 'text-warm-800/40 hover:text-warm-800/70'}`}>

          <HomeIcon
            className={`w-6 h-6 mb-1 ${activeTab === 'dashboard' ? 'fill-warm-900/10' : ''}`} />

          <span className="text-[10px] font-medium">Flow</span>
        </button>

        <button
          onClick={() => onTabChange('calendar')}
          className={`flex flex-col items-center justify-center w-12 h-full transition-colors ${activeTab === 'calendar' ? 'text-warm-900' : 'text-warm-800/40 hover:text-warm-800/70'}`}>

          <CalendarIcon
            className={`w-6 h-6 mb-1 ${activeTab === 'calendar' ? 'fill-warm-900/10' : ''}`} />

          <span className="text-[10px] font-medium">Plan</span>
        </button>

        <div className="absolute left-1/2 -translate-x-1/2 -top-6">
          <button
            onClick={onOpenAdd}
            className="w-14 h-14 bg-warm-900 text-white rounded-full flex items-center justify-center shadow-warm-lg hover:scale-105 active:scale-95 transition-all"
            aria-label="Log new activity">

            <PlusIcon className="w-7 h-7" />
          </button>
        </div>

        <button
          onClick={() => onTabChange('reflect')}
          className={`flex flex-col items-center justify-center w-12 h-full transition-colors ml-auto mr-2 ${activeTab === 'reflect' ? 'text-warm-900' : 'text-warm-800/40 hover:text-warm-800/70'}`}>

          <BookOpenIcon
            className={`w-6 h-6 mb-1 ${activeTab === 'reflect' ? 'fill-warm-900/10' : ''}`} />

          <span className="text-[10px] font-medium">Reflect</span>
        </button>

        <button
          onClick={() => onTabChange('profile')}
          className={`flex flex-col items-center justify-center w-12 h-full transition-colors ${activeTab === 'profile' ? 'text-warm-900' : 'text-warm-800/40 hover:text-warm-800/70'}`}>

          <UserIcon
            className={`w-6 h-6 mb-1 ${activeTab === 'profile' ? 'fill-warm-900/10' : ''}`} />

          <span className="text-[10px] font-medium">Profile</span>
        </button>
      </div>
    </div>);

}
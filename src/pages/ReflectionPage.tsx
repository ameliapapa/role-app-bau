import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
  PencilIcon } from
'lucide-react';
import { Role, Reflection } from '../types';
import { generateId } from '../utils/roleUtils';
interface ReflectionPageProps {
  roles: Role[];
  reflections: Reflection[];
  onSaveReflection: (reflection: Reflection) => void;
}
type Cadence = 'daily' | 'weekly' | 'quarterly';
const PROMPTS = {
  daily: [
  'What is your main intention for today?',
  'Which role needs your most focused energy?',
  'What are you grateful for right now?'],

  weekly: [
  'How would you like your week to feel?',
  'For which roles would you like to make space for this week?',
  "What would be one meaningful activity you'd like to accomplish this week?"],

  quarterly: [
  'Which roles shaped my life the most this quarter—and did that feel right?',
  'Which role received less time or attention than I hoped?',
  'If next quarter felt more balanced and meaningful, what would be different?']

};
export function ReflectionPage({
  roles,
  reflections,
  onSaveReflection
}: ReflectionPageProps) {
  const [cadence, setCadence] = useState<Cadence>('weekly');
  const [offset, setOffset] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<'view' | 'edit'>('edit');
  // Calculate the timestamp representing the current viewed period
  const periodTimestamp = useMemo(() => {
    const now = new Date();
    if (cadence === 'daily') {
      now.setDate(now.getDate() + offset);
      now.setHours(0, 0, 0, 0);
    } else if (cadence === 'weekly') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      now.setDate(diff + offset * 7);
      now.setHours(0, 0, 0, 0);
    } else if (cadence === 'quarterly') {
      const quarter = Math.floor(now.getMonth() / 3);
      now.setMonth((quarter + offset) * 3);
      now.setDate(1);
      now.setHours(0, 0, 0, 0);
    }
    return now.getTime();
  }, [cadence, offset]);
  const periodLabel = useMemo(() => {
    const date = new Date(periodTimestamp);
    if (cadence === 'daily') {
      if (offset === 0) return 'Today';
      if (offset === -1) return 'Yesterday';
      if (offset === 1) return 'Tomorrow';
      return date.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
      });
    } else if (cadence === 'weekly') {
      if (offset === 0) return 'This Week';
      if (offset === -1) return 'Last Week';
      if (offset === 1) return 'Next Week';
      return `Week of ${date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric'
      })}`;
    } else {
      const q = Math.floor(date.getMonth() / 3) + 1;
      const year = date.getFullYear();
      if (offset === 0) return `This Quarter (Q${q} ${year})`;
      if (offset === -1) return `Last Quarter (Q${q} ${year})`;
      if (offset === 1) return `Next Quarter (Q${q} ${year})`;
      return `Q${q} ${year}`;
    }
  }, [cadence, offset, periodTimestamp]);
  // Find existing reflection for current period
  const existingReflection = useMemo(
    () =>
    reflections.find(
      (r) => r.type === cadence && r.timestamp === periodTimestamp
    ),
    [reflections, cadence, periodTimestamp]
  );
  // Load existing reflection when period changes
  useEffect(() => {
    if (existingReflection) {
      setAnswers(existingReflection.answers);
      setMode('view');
    } else {
      setAnswers({});
      setMode('edit');
    }
  }, [cadence, periodTimestamp, existingReflection]);
  const handleSave = () => {
    onSaveReflection({
      id: existingReflection ? existingReflection.id : generateId(),
      type: cadence,
      timestamp: periodTimestamp,
      answers
    });
    setMode('view');
  };
  const hasAnswers = Object.values(answers).some((val) => val.trim().length > 0);
  return (
    <div className="min-h-screen pb-28 pt-8 px-4 max-w-lg mx-auto">
      <header className="mb-6 px-2">
        <h1 className="text-3xl font-bold text-warm-900 mb-2">Reflect</h1>
        <p className="text-warm-800/60">
          Design a meaningful life, not just a schedule.
        </p>
      </header>

      {/* Cadence Tabs */}
      <div className="flex bg-warm-200/50 rounded-xl p-1 mb-6 mx-2">
        {(['daily', 'weekly', 'quarterly'] as Cadence[]).map((c) =>
        <button
          key={c}
          onClick={() => {
            setCadence(c);
            setOffset(0);
          }}
          className={`flex-1 py-2 text-sm font-bold rounded-lg capitalize transition-all ${cadence === c ? 'bg-white shadow-sm text-warm-900' : 'text-warm-800/60 hover:text-warm-900'}`}>

            {c}
          </button>
        )}
      </div>

      {/* Date Navigation */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-2 shadow-sm border border-warm-200 mb-6 mx-2">
        <button
          onClick={() => setOffset((o) => o - 1)}
          className="p-2 text-warm-800/60 hover:text-warm-900 hover:bg-warm-50 rounded-xl transition-colors">

          <ChevronLeftIcon className="w-5 h-5" />
        </button>
        <span className="font-bold text-warm-900">{periodLabel}</span>
        <button
          onClick={() => setOffset((o) => o + 1)}
          className="p-2 text-warm-800/60 hover:text-warm-900 hover:bg-warm-50 rounded-xl transition-colors">

          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="space-y-6 px-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${cadence}-${offset}-${mode}`}
            initial={{
              opacity: 0,
              y: 10
            }}
            animate={{
              opacity: 1,
              y: 0
            }}
            exit={{
              opacity: 0,
              y: -10
            }}
            transition={{
              duration: 0.2
            }}
            className="space-y-6">

            {mode === 'view' ?
            <>
                {PROMPTS[cadence].map((prompt, index) => {
                const answer = answers[prompt];
                if (!answer || !answer.trim()) return null;
                return (
                  <motion.div
                    key={index}
                    initial={{
                      opacity: 0,
                      y: 8
                    }}
                    animate={{
                      opacity: 1,
                      y: 0
                    }}
                    transition={{
                      delay: index * 0.08
                    }}
                    className="bg-white p-5 rounded-3xl shadow-warm border border-warm-200">

                      <p className="text-sm font-medium text-warm-800/50 mb-2">
                        {prompt}
                      </p>
                      <p className="text-warm-900 text-lg leading-relaxed whitespace-pre-wrap">
                        {answer}
                      </p>
                    </motion.div>);

              })}

                <button
                onClick={() => setMode('edit')}
                className="w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 bg-white border border-warm-200 text-warm-900 hover:bg-warm-50 shadow-sm transition-all">

                  <PencilIcon className="w-4 h-4" />
                  Edit Reflection
                </button>
              </> :

            <>
                {PROMPTS[cadence].map((prompt, index) =>
              <div
                key={index}
                className="bg-white p-5 rounded-3xl shadow-warm border border-warm-200">

                    <h3 className="font-bold text-warm-900 mb-3 text-lg leading-tight">
                      {prompt}
                    </h3>
                    <textarea
                  value={answers[prompt] || ''}
                  onChange={(e) =>
                  setAnswers((prev) => ({
                    ...prev,
                    [prompt]: e.target.value
                  }))
                  }
                  placeholder="Write your thoughts here..."
                  className="w-full h-24 bg-warm-50 border border-warm-100 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-warm-300 transition-all resize-none text-warm-900 placeholder:text-warm-800/40" />

                  </div>
              )}

                <div className="flex gap-3">
                  {existingReflection &&
                <button
                  onClick={() => {
                    setAnswers(existingReflection.answers);
                    setMode('view');
                  }}
                  className="flex-1 py-4 rounded-2xl font-bold text-warm-800/60 bg-warm-100 hover:bg-warm-200 transition-all">

                      Cancel
                    </button>
                }
                  <button
                  onClick={handleSave}
                  disabled={!hasAnswers}
                  className={`flex-1 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${hasAnswers ? 'bg-warm-900 text-white hover:bg-warm-800 shadow-warm-lg' : 'bg-warm-200 text-warm-800/40 cursor-not-allowed'}`}>

                    <CheckIcon className="w-5 h-5" />
                    {existingReflection ?
                  'Update Reflection' :
                  'Save Reflection'}
                  </button>
                </div>
              </>
            }
          </motion.div>
        </AnimatePresence>
      </div>
    </div>);

}
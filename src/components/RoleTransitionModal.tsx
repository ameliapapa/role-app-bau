import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, ArrowRightIcon, CheckIcon } from 'lucide-react';
import { Role, PRESET_COLORS } from '../types';
interface RoleTransitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole?: Role;
  targetRole: Role | null;
  onComplete: (roleId: string) => void;
}
export function RoleTransitionModal({
  isOpen,
  onClose,
  currentRole,
  targetRole,
  onComplete
}: RoleTransitionModalProps) {
  const [step, setStep] = useState<'closing' | 'opening'>('closing');
  const [closingNote, setClosingNote] = useState('');
  const [openingNote, setOpeningNote] = useState('');
  useEffect(() => {
    if (isOpen) {
      // If no current role, skip straight to opening
      setStep(currentRole ? 'closing' : 'opening');
      setClosingNote('');
      setOpeningNote('');
    }
  }, [isOpen, currentRole]);
  if (!isOpen || !targetRole) return null;
  const handleNext = () => {
    setStep('opening');
  };
  const handleComplete = () => {
    // Here we could optionally save the reflection notes to an activity log or journal
    // For now, we just complete the transition
    onComplete(targetRole.id);
    onClose();
  };
  const currentColor = currentRole ?
  PRESET_COLORS[currentRole.color] :
  '#4A4A45';
  const targetColor = PRESET_COLORS[targetRole.color];
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
          className="fixed inset-0 bg-warm-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose} />

          <motion.div
          initial={{
            opacity: 0,
            scale: 0.95,
            y: 20
          }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0
          }}
          exit={{
            opacity: 0,
            scale: 0.95,
            y: 20
          }}
          className="fixed left-4 right-4 top-1/2 -translate-y-1/2 max-w-md mx-auto bg-white rounded-3xl shadow-warm-lg overflow-hidden z-50">

            <AnimatePresence mode="wait">
              {step === 'closing' && currentRole ?
            <motion.div
              key="closing"
              initial={{
                opacity: 0,
                x: -20
              }}
              animate={{
                opacity: 1,
                x: 0
              }}
              exit={{
                opacity: 0,
                x: -20
              }}
              className="p-6 md:p-8">

                  <div className="flex justify-between items-start mb-6">
                    <div
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium mb-4"
                  style={{
                    backgroundColor: `${currentColor}20`,
                    color: currentColor
                  }}>

                      <span>{currentRole.emoji}</span>
                      <span>Closing {currentRole.name}</span>
                    </div>
                    <button
                  onClick={onClose}
                  className="p-2 text-warm-800/40 hover:text-warm-900 transition-colors">

                      <XIcon className="w-5 h-5" />
                    </button>
                  </div>

                  <h2 className="text-2xl font-bold text-warm-900 mb-2">
                    What can wait until tomorrow?
                  </h2>
                  <p className="text-warm-800/60 mb-6">
                    Take a breath. Leave your {currentRole.name} tasks here
                    before moving on.
                  </p>

                  <textarea
                value={closingNote}
                onChange={(e) => setClosingNote(e.target.value)}
                placeholder="Jot down a quick thought to clear your mind..."
                className="w-full h-32 bg-warm-50 border border-warm-200 rounded-2xl p-4 outline-none focus:ring-2 transition-all resize-none text-warm-900 placeholder:text-warm-800/40 mb-6"
                style={{
                  focusRingColor: currentColor
                }} />


                  <div className="flex justify-end">
                    <button
                  onClick={handleNext}
                  className="px-6 py-3 rounded-xl font-medium text-white flex items-center gap-2 hover:opacity-90 transition-opacity"
                  style={{
                    backgroundColor: currentColor
                  }}>

                      Release & Next
                      <ArrowRightIcon className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div> :

            <motion.div
              key="opening"
              initial={{
                opacity: 0,
                x: 20
              }}
              animate={{
                opacity: 1,
                x: 0
              }}
              exit={{
                opacity: 0,
                x: 20
              }}
              className="p-6 md:p-8">

                  <div className="flex justify-between items-start mb-6">
                    <div
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium mb-4"
                  style={{
                    backgroundColor: `${targetColor}20`,
                    color: targetColor
                  }}>

                      <span>{targetRole.emoji}</span>
                      <span>Opening {targetRole.name}</span>
                    </div>
                    <button
                  onClick={onClose}
                  className="p-2 text-warm-800/40 hover:text-warm-900 transition-colors">

                      <XIcon className="w-5 h-5" />
                    </button>
                  </div>

                  <h2 className="text-2xl font-bold text-warm-900 mb-2">
                    What matters most right now?
                  </h2>
                  <p className="text-warm-800/60 mb-6">
                    Set your intention for your time as {targetRole.name}.
                  </p>

                  <textarea
                value={openingNote}
                onChange={(e) => setOpeningNote(e.target.value)}
                placeholder="My focus for the next hour is..."
                className="w-full h-32 bg-warm-50 border border-warm-200 rounded-2xl p-4 outline-none focus:ring-2 transition-all resize-none text-warm-900 placeholder:text-warm-800/40 mb-6"
                style={{
                  focusRingColor: targetColor
                }} />


                  <div className="flex justify-end">
                    <button
                  onClick={handleComplete}
                  className="px-6 py-3 rounded-xl font-medium text-white flex items-center gap-2 hover:opacity-90 transition-opacity"
                  style={{
                    backgroundColor: targetColor
                  }}>

                      Start Focus
                      <CheckIcon className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
            }
            </AnimatePresence>
          </motion.div>
        </>
      }
    </AnimatePresence>);

}
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { usePOS } from '../context/POSContext';
import { X } from 'lucide-react';

export const IndependenceOverlay: React.FC = () => {
  const { showIndependenceModal, setShowIndependenceModal } = usePOS();
  const [refreshes, setRefreshes] = useState<number>(14);

  useEffect(() => {
    if (!showIndependenceModal) return;

    // Fire green and white celebratory confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#00401A', '#017935', '#2ECC71', '#FFFFFF', '#F1F2F6']
    });

    const timer = setTimeout(() => {
      setShowIndependenceModal(false);
    }, 4500);

    return () => clearTimeout(timer);
  }, [showIndependenceModal, setShowIndependenceModal]);

  if (!showIndependenceModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      <button
        type="button"
        onClick={() => setShowIndependenceModal(false)}
        className="absolute top-6 right-6 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Flag Animation Container */}
      <div className="text-center flex flex-col items-center">
        {/* Pakistani Flag Stylized SVG */}
        <div className="relative w-72 h-48 rounded-2xl overflow-hidden shadow-2xl border-4 border-emerald-500/30 animate-pulse [animation-duration:3s]">
          {/* Green Field */}
          <div className="absolute inset-0 bg-[#01411C] flex items-center justify-center">
            {/* White stripe on left */}
            <div className="absolute left-0 top-0 bottom-0 w-1/4 bg-white" />
            
            {/* Crescent and Star */}
            <div className="relative ml-16 flex items-center justify-center">
              {/* Crescent */}
              <div className="w-20 h-20 rounded-full bg-white relative">
                <div className="w-16 h-16 rounded-full bg-[#01411C] absolute top-1 right-1" />
              </div>
              {/* Star */}
              <div className="absolute -top-1 -right-1 text-white text-3xl font-bold select-none">
                ★
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#2ecc71] drop-shadow-md">
            Independence Day Celebration
          </h2>
          <p className="text-xl sm:text-2xl font-bold text-white mt-2 font-mono tracking-wide">
            Pakistan Independence Day 🤍💚
          </p>
        </div>

        <div className="mt-8 bg-white/15 text-white text-xs font-semibold px-5 py-2 rounded-full border border-white/30 backdrop-blur-md">
          Remaining Views: {refreshes}/14
        </div>
      </div>
    </div>
  );
};

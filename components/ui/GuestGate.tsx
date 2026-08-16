import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Lock } from 'lucide-react';

interface GuestGateProps {
  children: React.ReactNode;
  /** If true, shows a blurred preview of children behind the gate */
  showPreview?: boolean;
  /** Custom message to show above the CTA */
  preMessage?: string;
}

const GuestGate: React.FC<GuestGateProps> = ({ children, showPreview = true, preMessage }) => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Blurred preview of content */}
      {showPreview && (
        <div className="relative overflow-hidden" style={{ maxHeight: '400px' }}>
          <div className="pointer-events-none select-none filter blur-sm opacity-40">
            {children}
          </div>
          {/* Gradient fade overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/70 to-slate-900" />
        </div>
      )}

      {/* CTA Banner */}
      <div className={`${showPreview ? '-mt-32 relative z-10' : ''} px-4 sm:px-6 lg:px-8 py-8`}>
        {preMessage && (
          <div className="flex items-center justify-center gap-2 mb-4">
            <Lock className="w-4 h-4 text-slate-400" />
            <p className="text-slate-400 text-sm text-center">{preMessage}</p>
          </div>
        )}
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-gradient-to-br from-slate-800 via-[#1a2744] to-[#162035] rounded-2xl p-6 sm:p-8 md:p-10 overflow-hidden border border-slate-700/50">
            {/* Subtle background glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl" />
            
            <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3">
                  Ready to Level Up Your Investing?
                </h2>
                <p className="text-slate-300/80 max-w-xl text-sm sm:text-base">
                  Join investors who are already using The Club to make smarter investment decisions.
                </p>
              </div>
              <a
                href="https://nas.io/nacci-members-club"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 px-6 sm:px-8 py-3 sm:py-4 bg-white text-slate-900 font-semibold rounded-xl hover:bg-slate-100 transition-all shadow-lg hover:shadow-xl text-sm sm:text-base"
              >
                Get Started Free
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestGate;

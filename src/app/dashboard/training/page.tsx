'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Lock, ChevronRight } from 'lucide-react';

interface UserData {
  userId: string;
  module: string | null;
  moduleAssignment: string | null;
}

interface ModuleCard {
  key: string;             // e.g. 'digitization', 'mobile_mapping'
  label: string;
  description: string;
  path: string;            // where to navigate for this training
  progressKey: string;     // key in the progress object
  maxSteps: number;
}

const ALL_MODULES: ModuleCard[] = [
  {
    key: 'digitization_mapper',
    label: 'Digitization — Mapper',
    description: 'JOSM, OSM workflow, HOT Tasking Manager',
    path: '/digitization/mapper',
    progressKey: 'mapper',
    maxSteps: 7,
  },
  {
    key: 'digitization_validator',
    label: 'Digitization — Validator',
    description: 'Quality review, validation workflow',
    path: '/digitization/validator',
    progressKey: 'validator',
    maxSteps: 7,
  },
  {
    key: 'mobile_mapping',
    label: 'Mobile Mapping',
    description: 'ODK Collect, field data collection',
    path: '/mobile-mapping',
    progressKey: 'mobile_mapping',
    maxSteps: 4,
  },
  {
    key: 'household_survey',
    label: 'Household Survey',
    description: 'Survey forms and data collection',
    path: '/household-survey',
    progressKey: 'household_survey',
    maxSteps: 4,
  },
  {
    key: 'microtasking',
    label: 'Microtasking',
    description: 'Image classification on smartphone',
    path: '/microtasking',
    progressKey: 'microtasking',
    maxSteps: 3,
  },
];

function getModuleCards(module: string | null, moduleAssignment: string | null): ModuleCard[] {
  if (!module) return [];

  const normalize = (m: string) => m.toLowerCase().trim();
  const mod = normalize(module);

  if (mod === 'both') return ALL_MODULES;

  if (mod.includes(',')) {
    const parts = mod.split(',').map(normalize);
    return ALL_MODULES.filter((c) => {
      const ck = c.key.split('_')[0]; // 'digitization', 'mobile', 'microtasking'...
      return parts.some((p) => c.key.startsWith(p) || c.progressKey === p);
    });
  }

  if (mod === 'digitization') {
    // Show only the correct assignment sub-module
    if (moduleAssignment === 'validator') {
      return ALL_MODULES.filter((c) => c.key === 'digitization_validator');
    }
    return ALL_MODULES.filter((c) => c.key === 'digitization_mapper');
  }

  // Direct map
  const found = ALL_MODULES.find((c) => c.progressKey === mod || c.key === mod);
  return found ? [found] : [];
}

function getMicrotaskingCompleted(progress: Record<string, number[]>): number {
  return (
    ((progress['microtasking1']?.length ?? 0) > 0 ? 1 : 0) +
    ((progress['microtasking2']?.length ?? 0) > 0 ? 1 : 0) +
    ((progress['microtasking3']?.length ?? 0) > 0 ? 1 : 0)
  );
}

export default function TrainingPage() {
  const router = useRouter();
  const [moduleCards, setModuleCards] = useState<ModuleCard[]>([]);
  const [progress, setProgress] = useState<Record<string, number[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('userData');
    if (!token || !userData) { router.replace('/'); return; }

    let user: UserData;
    try { user = JSON.parse(userData); } catch { router.replace('/'); return; }

    const cards = getModuleCards(user.module, user.moduleAssignment);
    setModuleCards(cards);

    fetch('/api/training/progress', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setProgress(data.data.progress ?? {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#dc2626]" />
      </div>
    );
  }

  return (
    <div className="bg-black px-4 pt-8 pb-4">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-white font-heading mb-1">Training</h1>
        <p className="text-[#737373] text-sm mb-6">Complete all steps to qualify for work</p>

        {moduleCards.length === 0 ? (
          <div className="bg-[#111111] border border-[#262626] rounded-2xl p-8 text-center">
            <p className="text-[#737373] text-sm">No training modules assigned yet. Contact your trainer.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {moduleCards.map((card) => {
              const completed =
                card.key === 'microtasking'
                  ? getMicrotaskingCompleted(progress)
                  : (progress[card.progressKey]?.length ?? 0);
              const pct = card.maxSteps > 0 ? Math.round((completed / card.maxSteps) * 100) : 0;
              const done = completed >= card.maxSteps;

              return (
                <button
                  key={card.key}
                  onClick={() => router.push(card.path)}
                  className="w-full bg-[#111111] border border-[#262626] rounded-2xl p-5 text-left hover:border-[#dc2626]/50 active:bg-white/5 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0 pr-3">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h2 className="text-white font-semibold text-base leading-tight">{card.label}</h2>
                        {done && <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />}
                      </div>
                      <p className="text-[#737373] text-xs">{card.description}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[#dc2626] text-sm font-bold font-heading">{pct}%</span>
                      <ChevronRight className="w-4 h-4 text-[#737373]" />
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${done ? 'bg-green-500' : 'bg-[#dc2626]'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[#737373] text-xs whitespace-nowrap">
                      {completed}/{card.maxSteps} steps
                    </span>
                  </div>

                  {done && (
                    <div className="mt-3 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-1.5">
                      <p className="text-green-400 text-xs font-medium">✓ Training complete</p>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Note for locked states */}
        {moduleCards.length > 0 && (
          <div className="mt-6 flex items-start gap-2 bg-[#111111] border border-[#262626] rounded-xl p-4">
            <Lock className="w-4 h-4 text-[#737373] flex-shrink-0 mt-0.5" />
            <p className="text-[#737373] text-xs">
              Steps must be completed in order. Tap a module card to continue where you left off.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

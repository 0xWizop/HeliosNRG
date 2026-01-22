'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Users, 
  Building2, 
  ArrowRight,
  Loader2,
  CheckCircle,
  Globe,
  Zap
} from 'lucide-react';
import { doc, setDoc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';

type SetupStep = 'team' | 'complete';

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<SetupStep>('team');
  const [teamName, setTeamName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [teamSize, setTeamSize] = useState<string>('1-10');
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth!, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        router.push('/login');
      }
      setIsCheckingAuth(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !teamName) return;

    setIsLoading(true);

    try {
      const teamId = `team-${Date.now()}`;
      
      // Create team document
      await setDoc(doc(db!, 'teams', teamId), {
        name: teamName,
        companyName: companyName || null,
        size: teamSize,
        ownerId: userId,
        memberIds: [userId],
        createdAt: Timestamp.now(),
        settings: {
          defaultPUE: 1.58,
          defaultCarbonIntensity: 436,
        },
      });

      // Update user with team ID
      await updateDoc(doc(db!, 'users', userId), {
        teamIds: arrayUnion(teamId),
        currentTeamId: teamId,
      });

      setStep('complete');
      
      // Redirect after showing success
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err) {
      console.error('Failed to create team:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-neutral-950 overflow-hidden flex flex-col">
      {/* Header */}
      <header className="border-b border-neutral-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-2 h-2 bg-amber-500 rounded-full" />
            <span className="text-sm font-mono font-medium tracking-wider text-neutral-100">HELIOS</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col px-4 sm:px-6 py-6">
      <div className="w-full max-w-md mx-auto flex flex-col flex-1">
        {step === 'team' && (
          <div className="flex flex-col flex-1">
            {/* Progress indicator */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-7 h-7 bg-amber-500 flex items-center justify-center">
                <span className="text-xs font-mono text-neutral-950">1</span>
              </div>
              <div className="h-px flex-1 bg-neutral-800" />
              <div className="w-7 h-7 bg-neutral-800 flex items-center justify-center">
                <span className="text-xs font-mono text-neutral-500">2</span>
              </div>
            </div>

            <div className="mb-4">
              <h1 className="text-xl font-mono text-neutral-100 tracking-tight mb-2">
                Create your team
              </h1>
              <p className="text-sm text-neutral-500">
                Set up your workspace to start tracking.
              </p>
            </div>

            <form onSubmit={handleCreateTeam} className="flex flex-col flex-1">
              <div className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-neutral-500 uppercase tracking-wider mb-1">
                  Team Name *
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Engineering, Data Science, etc."
                    className="input pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-500 uppercase tracking-wider mb-1">
                  Company Name (Optional)
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Your company"
                    className="input pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-500 uppercase tracking-wider mb-1">
                  Team Size
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['1-10', '11-50', '51-200', '200+'].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setTeamSize(size)}
                      className={`py-2.5 px-3 text-xs font-mono transition-colors ${
                        teamSize === size
                          ? 'bg-amber-500 text-neutral-950'
                          : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:border-neutral-700'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              </div>

              {/* What you'll get */}
              <div className="flex-1 flex items-center justify-center border-t border-neutral-800 mt-3">
                <div className="w-full">
                  <p className="text-xs font-mono text-neutral-500 uppercase tracking-wider mb-2">What's included</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-amber-500 shrink-0" />
                      <span className="text-xs text-neutral-400">Workload tracking</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-amber-500 shrink-0" />
                      <span className="text-xs text-neutral-400">Cloud integrations</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-amber-500 shrink-0" />
                      <span className="text-xs text-neutral-400">Team collaboration</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-amber-500 shrink-0" />
                      <span className="text-xs text-neutral-400">Carbon reporting</span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !teamName}
                className="w-full btn-primary flex items-center justify-center gap-2 py-3 mt-auto mb-4"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Create Team
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {step === 'complete' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 mx-auto mb-6 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-amber-500" />
            </div>
            <h1 className="text-2xl font-mono text-neutral-100 tracking-tight mb-2">
              You're all set!
            </h1>
            <p className="text-neutral-500 mb-8">
              Your team has been created. Redirecting to dashboard...
            </p>
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
              <span className="text-sm text-neutral-500">Loading dashboard</span>
            </div>
          </div>
        )}
      </div>
      </main>
    </div>
  );
}

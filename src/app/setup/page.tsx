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
    <div className="min-h-screen bg-neutral-950">
      {/* Header */}
      <header className="border-b border-neutral-800">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-2 h-2 bg-amber-500 rounded-full" />
            <span className="text-sm font-mono font-medium tracking-wider text-neutral-100">HELIOS</span>
          </Link>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 py-16">
        {step === 'team' && (
          <>
            {/* Progress indicator */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 bg-amber-500 flex items-center justify-center">
                <span className="text-xs font-mono text-neutral-950">1</span>
              </div>
              <div className="h-px flex-1 bg-neutral-800" />
              <div className="w-8 h-8 bg-neutral-800 flex items-center justify-center">
                <span className="text-xs font-mono text-neutral-500">2</span>
              </div>
            </div>

            <div className="mb-8">
              <h1 className="text-2xl font-mono text-neutral-100 tracking-tight mb-2">
                Create your team
              </h1>
              <p className="text-neutral-500">
                Set up your workspace to start tracking cloud infrastructure metrics.
              </p>
            </div>

            <form onSubmit={handleCreateTeam} className="space-y-6">
              <div>
                <label className="block text-xs font-mono text-neutral-500 uppercase tracking-wider mb-2">
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
                <label className="block text-xs font-mono text-neutral-500 uppercase tracking-wider mb-2">
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
                <label className="block text-xs font-mono text-neutral-500 uppercase tracking-wider mb-2">
                  Team Size
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['1-10', '11-50', '51-200', '200+'].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setTeamSize(size)}
                      className={`py-3 px-4 text-sm font-mono transition-colors ${
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

              {/* What you'll get */}
              <div className="pt-6 border-t border-neutral-800">
                <p className="text-xs font-mono text-neutral-500 uppercase tracking-wider mb-4">What's included</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-amber-500" />
                    <span className="text-sm text-neutral-400">Unlimited workload tracking</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-amber-500" />
                    <span className="text-sm text-neutral-400">Cloud provider integrations</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-amber-500" />
                    <span className="text-sm text-neutral-400">Team collaboration features</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-amber-500" />
                    <span className="text-sm text-neutral-400">Carbon & cost reporting</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !teamName}
                className="w-full btn-primary flex items-center justify-center gap-2 py-3"
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
          </>
        )}

        {step === 'complete' && (
          <div className="text-center py-12">
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
      </main>
    </div>
  );
}

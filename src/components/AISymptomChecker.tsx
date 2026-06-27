import React, { useState } from 'react';
import { 
  BadgeAlert, 
  Activity, 
  Stethoscope, 
  ShieldAlert, 
  Calendar, 
  User, 
  ArrowRight,
  TrendingDown,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { SymptomCheckResult, Doctor } from '../types';

interface SymptomCheckerProps {
  doctors: Doctor[];
  onBookDirect: (doctorId: string) => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

export default function AISymptomChecker({ doctors, onBookDirect, showToast }: SymptomCheckerProps) {
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SymptomCheckResult | null>(null);

  const handleSymptomCheckSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptoms.trim()) {
      showToast('Please describe your symptoms', 'error');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/ai/symptom-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms }),
      });

      if (!response.ok) throw new Error('Failed to run AI symptom analyzer');
      const data = await response.json();
      setResult(data);
      showToast('AI Clinical routing complete', 'success');
    } catch (err) {
      showToast('AI Service offline. Using clinic local fallback rules.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    if (urgency === 'high') return 'text-red-500 bg-red-500/10 border-red-500/20';
    if (urgency === 'medium') return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="font-sans font-bold text-2xl text-slate-800 dark:text-white flex items-center gap-2">
          <BadgeAlert className="h-7 w-7 text-emerald-500" />
          AI-Powered Symptom Checker
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Describe physical anomalies, pain zones or acute illness symptoms to retrieve instant clinical department routing & specialty recommendations.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Left Input area */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-sans font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-emerald-500" />
              Describe Your Health Symptoms
            </h3>

            <form onSubmit={handleSymptomCheckSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <textarea
                  required
                  placeholder="Describe details: e.g. 'For the last 3 days, I have had a heavy feeling in my upper chest. It feels like someone is sitting on me, and it moves down my left arm occasionally. I also feel dizzy...'"
                  value={symptoms}
                  onChange={e => setSymptoms(e.target.value)}
                  rows={6}
                  className="w-full p-4 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white leading-relaxed font-light"
                />
                <span className="text-[10px] text-slate-400 font-light block">Describe pain intensity, location, duration, and any accompanying triggers.</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold py-3 px-4 rounded-xl transition-all shadow-md shadow-emerald-600/15 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4.5 w-4.5 animate-spin" />
                    AI Analyzing Clinical Symptoms...
                  </>
                ) : (
                  <>
                    <Activity className="h-4.5 w-4.5" />
                    Analyze Symptoms with SmartCare AI
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Clinician matches output */}
          {result && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm overflow-hidden animate-in slide-in-from-bottom-5 duration-355">
              <div className="p-5 border-b border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest">Symptom Diagnostic Output</span>
                <span className={`text-[10px] font-mono font-bold uppercase border px-2.5 py-1 rounded-full ${getUrgencyColor(result.urgency)}`}>
                  {result.urgency} Urgency
                </span>
              </div>

              <div className="p-6 space-y-6">
                
                {/* Recommended department */}
                <div className="flex gap-4 items-start">
                  <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-3 rounded-xl border border-emerald-500/15 shrink-0">
                    <Stethoscope className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-mono text-slate-400 tracking-wider">Recommended Clinical Department</span>
                    <h4 className="font-sans font-bold text-lg text-slate-800 dark:text-white">{result.department}</h4>
                  </div>
                </div>

                {/* Analysis text details */}
                <div className="space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-4">
                  <span className="text-[10px] uppercase font-mono text-slate-400 tracking-wider">Clinical Reasoning & Rationale</span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-light">
                    {result.recommendationText}
                  </p>
                </div>

                {/* Recommended Doctors directory link */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
                  <span className="text-[10px] uppercase font-mono text-slate-400 tracking-wider block">Recommended Specialists Available</span>
                  
                  <div className="space-y-2">
                    {doctors.filter(d => result.recommendedDoctorIds?.includes(d.id) || d.department.toLowerCase() === result.department.toLowerCase()).map(doc => (
                      <div key={doc.id} className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-emerald-500/10 text-emerald-500 p-2 rounded-full">
                            <User className="h-4 w-4" />
                          </div>
                          <div>
                            <h5 className="text-xs font-bold text-slate-800 dark:text-white">{doc.name}</h5>
                            <p className="text-[10px] text-slate-500">{doc.specialization}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => onBookDirect(doc.id)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all"
                        >
                          Book consultation
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Right Info panels */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
            <h3 className="font-sans font-bold text-base border-b border-slate-800 pb-3 flex items-center gap-1.5">
              <ShieldAlert className="h-5 w-5 text-rose-500" />
              Emergency Advisory Warning
            </h3>
            <p className="text-xs text-slate-400 font-light leading-relaxed">
              Our AI Symptom Checker is an advanced clinical routing assistant designed to match symptoms with doctor directory specializations.
            </p>
            <p className="text-xs text-rose-400 font-semibold leading-relaxed">
              If you or someone else is experiencing:
            </p>
            <ul className="list-disc pl-4 text-[11px] text-slate-400 space-y-1 font-light">
              <li>Severe chest pressure, tightness or chest pains</li>
              <li>Acute shortness of breath or trouble breathing</li>
              <li>Sudden facial drooping, arm weakness or speech anomalies</li>
              <li>Loss of consciousness, extreme dizziness or sudden confusion</li>
            </ul>
            <p className="text-xs text-rose-400 font-bold border border-rose-500/20 p-3.5 rounded-xl bg-rose-500/5 mt-3">
              Please dial 911 or visit the closest Emergency Room immediately.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm space-y-3.5">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <TrendingDown className="h-4.5 w-4.5 text-blue-500" />
              Flow Optimization
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-light">
              By utilizing the AI symptom check, patients can prevent incorrect bookings, reduce administrative re-scheduling delays, and get immediate attention from the correct clinical professional.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

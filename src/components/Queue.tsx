import React, { useState } from 'react';
import { 
  Activity, 
  Clock, 
  Users, 
  UserPlus, 
  CheckCircle, 
  SkipForward, 
  Stethoscope, 
  AlertCircle,
  HelpCircle,
  TrendingDown,
  X
} from 'lucide-react';
import { User, Doctor, QueueItem } from '../types';

interface QueueProps {
  user: User;
  doctors: Doctor[];
  queue: QueueItem[];
  onCallNextPatient: (doctorId: string) => Promise<void>;
  onSkipPatient: (appointmentId: string) => Promise<void>;
  onGenerateWalkInToken: (walkIn: { doctorId: string; patientName: string; patientPhone?: string }) => Promise<void>;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

export default function Queue({
  user,
  doctors,
  queue,
  onCallNextPatient,
  onSkipPatient,
  onGenerateWalkInToken,
  showToast
}: QueueProps) {
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [doctorId, setDoctorId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const activeWaitingQueue = queue.filter(q => q.status === 'waiting');
  const inConsultationQueue = queue.filter(q => q.status === 'in-consultation');

  const handleGenerateWalkInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorId || !patientName) {
      showToast('Doctor and patient name are required', 'error');
      return;
    }

    setLoading(true);
    try {
      await onGenerateWalkInToken({ doctorId, patientName, patientPhone });
      setShowWalkInModal(false);
      setDoctorId('');
      setPatientName('');
      setPatientPhone('');
    } catch (err: any) {
      showToast(err.message || 'Failed to generate walk-in token', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-sans font-bold text-2xl text-slate-800 dark:text-white">Hospital Live Queue Management</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Track active consultations, monitor estimated patient waiting times, and issue walk-in queue tokens.</p>
        </div>

        {user.role === 'admin' && (
          <button
            onClick={() => {
              setDoctorId(doctors[0]?.id || '');
              setShowWalkInModal(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold py-2.5 px-4 rounded-xl shadow-md transition-all flex items-center gap-2 active:scale-95"
          >
            <UserPlus className="h-5 w-5" />
            Issue Walk-In Token
          </button>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns - Active Wait lists */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section: In consultation */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-150 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20">
              <h3 className="font-sans font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                Active Consultations (In Progress)
              </h3>
              <span className="text-xs text-slate-400">{inConsultationQueue.length} Active Rooms</span>
            </div>

            {inConsultationQueue.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 italic">
                No active consultation in progress. Clinicians are ready to call next.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {inConsultationQueue.map(item => (
                  <div key={item.appointmentId} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase font-mono tracking-widest text-red-500 font-bold bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/10">In Room</span>
                      <h4 className="font-bold text-sm text-slate-800 dark:text-white mt-1">{item.patientName}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Assigned Clinician: <strong className="text-slate-700 dark:text-slate-300">{item.doctorName}</strong></p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="bg-slate-900 dark:bg-slate-950 border border-slate-800 text-emerald-400 text-xs font-mono font-bold px-3 py-1.5 rounded-xl">
                        Token #{item.tokenNumber}
                      </span>
                      {/* Doctor or admin context actions */}
                      {(user.role === 'admin' || user.profileId === item.doctorId) && (
                        <button
                          onClick={() => onCallNextPatient(item.doctorId)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4.5 py-1.5 rounded-xl transition-all shadow-sm shadow-emerald-600/15"
                        >
                          Complete Consultation
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Waiting patients */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-150 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20">
              <h3 className="font-sans font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                <Users className="h-4.5 w-4.5 text-slate-400" />
                Clinician Waiting Queues
              </h3>
              <span className="text-xs text-slate-400">{activeWaitingQueue.length} Patients Waiting</span>
            </div>

            {activeWaitingQueue.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400 space-y-2">
                <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto" />
                <p>All clinics are currently clear of queues. Excellent timing!</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {activeWaitingQueue.map((item, index) => {
                  const isOwnQueueItem = user.profileId === item.patientId;
                  return (
                    <div 
                      key={item.appointmentId} 
                      className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                        isOwnQueueItem ? 'bg-emerald-50/30 dark:bg-emerald-950/10' : ''
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 h-10 w-10 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 font-mono font-bold">
                          #{index + 1}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-1.5">
                            {item.patientName}
                            {isOwnQueueItem && (
                              <span className="bg-emerald-500/10 text-emerald-600 text-[9px] uppercase font-mono px-2 py-0.5 rounded-full font-bold">Your Token</span>
                            )}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>Clinician: <strong>{item.doctorName}</strong></span>
                            <span>•</span>
                            <span>Wait: <strong className="text-emerald-600">{item.estimatedWaitTime} mins</strong></span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 justify-end">
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono font-bold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                          Token #{item.tokenNumber}
                        </span>

                        {/* Skip or Call context buttons */}
                        {(user.role === 'admin' || user.profileId === item.doctorId) && (
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => onSkipPatient(item.appointmentId)}
                              className="p-2 text-slate-500 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-150 dark:border-slate-800/80 transition-colors"
                              title="Mark Patient Absent / Skip"
                            >
                              <SkipForward className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Right Columns - Metrics & Quick Actions */}
        <div className="space-y-6">
          
          {/* Section: Queue metrics summary */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl space-y-6">
            <h3 className="font-sans font-bold text-base border-b border-slate-800 pb-4">Clinic Flow Analysis</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Average consultation length</span>
                <span className="font-mono font-semibold">15 Minutes</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Total waiting patients</span>
                <span className="font-mono font-semibold text-emerald-400">{activeWaitingQueue.length} Patients</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Estimated throughput index</span>
                <span className="font-mono font-semibold text-blue-400">92% throughput</span>
              </div>
            </div>

            <div className="bg-slate-950/60 p-4 border border-slate-800 rounded-2xl flex gap-3 items-start">
              <TrendingDown className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-semibold">Estimated Wait Time</p>
                <p className="text-slate-400 font-light leading-relaxed">
                  Wait times are calculated dynamically based on average consultation time and the active clinic pipeline size.
                </p>
              </div>
            </div>
          </div>

          {/* Section: Advisory warning */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm space-y-3.5">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <AlertCircle className="h-4.5 w-4.5 text-rose-500" />
              Patient Attendance Advisory
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-light">
              Patients are requested to arrive at least 10 minutes prior to their estimated wait time slot. Absent patients can be skipped or canceled from active queues by managing staff.
            </p>
          </div>

        </div>

      </div>

      {/* WALK-IN ISSUE TOKEN MODAL */}
      {showWalkInModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in zoom-in-95 duration-250">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="font-sans font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-emerald-500" />
                  Issue Walk-In Queue Token
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Generate a live waitlist token for offline clinic registrations.</p>
              </div>
              <button onClick={() => setShowWalkInModal(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleGenerateWalkInSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Select Clinician</label>
                <select
                  required
                  value={doctorId}
                  onChange={e => setDoctorId(e.target.value)}
                  className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white focus:outline-none"
                >
                  <option value="" disabled>Select Doctor...</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Patient Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Enter walk-in patient name..."
                  value={patientName}
                  onChange={e => setPatientName(e.target.value)}
                  className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Contact Phone (Optional)</label>
                <input
                  type="text"
                  placeholder="+1 (555) 000-0000"
                  value={patientPhone}
                  onChange={e => setPatientPhone(e.target.value)}
                  className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowWalkInModal(false)}
                  className="px-4 py-2 text-xs font-bold border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md disabled:opacity-50"
                >
                  {loading ? 'Issuing token...' : 'Confirm Walk-In'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

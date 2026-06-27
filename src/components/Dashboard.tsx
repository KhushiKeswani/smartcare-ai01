import React, { useState } from 'react';
import { 
  Users, 
  Calendar, 
  Clock, 
  Activity, 
  Stethoscope, 
  FileText, 
  TrendingUp, 
  HelpCircle, 
  Plus, 
  ChevronRight, 
  Play, 
  CheckCircle, 
  AlertTriangle,
  User as UserIcon
} from 'lucide-react';
import { User, Doctor, Patient, Appointment, QueueItem } from '../types';

interface DashboardProps {
  user: User;
  doctors: Doctor[];
  patients: Patient[];
  appointments: Appointment[];
  queue: QueueItem[];
  setActiveTab: (tab: string) => void;
  onCallNextPatient: (doctorId: string) => Promise<void>;
  onSkipPatient: (appointmentId: string) => Promise<void>;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

export default function Dashboard({
  user,
  doctors,
  patients,
  appointments,
  queue,
  setActiveTab,
  onCallNextPatient,
  onSkipPatient,
  showToast
}: DashboardProps) {
  
  const [callingNext, setCallingNext] = useState(false);

  // Stats derivation
  const activeQueue = queue.filter(q => q.status === 'waiting');
  const activeConsultation = queue.find(q => q.status === 'in-consultation' && (user.role !== 'doctor' || q.doctorId === user.profileId));
  const activeAppointments = appointments.filter(a => a.status === 'booked' || a.status === 'rescheduled');
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter(a => a.date === todayStr && (a.status === 'booked' || a.status === 'rescheduled'));

  // Handler for doctor Call Next
  const handleCallNext = async () => {
    if (!user.profileId) return;
    setCallingNext(true);
    try {
      await onCallNextPatient(user.profileId);
    } catch (err: any) {
      showToast(err.message || 'Failed to call next patient', 'error');
    } finally {
      setCallingNext(false);
    }
  };

  return (
    <div className="space-y-8 p-1">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-8 text-white relative overflow-hidden shadow-lg shadow-emerald-600/10">
        <div className="absolute right-0 bottom-0 top-0 opacity-10 flex items-center justify-center p-8">
          <Activity className="h-48 w-48" />
        </div>
        <div className="relative z-10 max-w-xl space-y-3">
          <span className="bg-emerald-500/20 text-emerald-200 border border-emerald-400/20 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider">
            SmartCare AI Portal
          </span>
          <h2 className="font-sans font-bold text-3xl tracking-tight leading-tight">
            Welcome, {user.name}
          </h2>
          <p className="text-emerald-100 text-sm leading-relaxed">
            {user.role === 'admin' && "You have total clinic administrative control. Manage doctors, clinical operations, schedules, and view AI system throughput."}
            {user.role === 'doctor' && "Review your schedule, manage live patients queue, call walk-ins, and consult diagnostic medical history in real-time."}
            {user.role === 'patient' && "Access your doctor roster, check upcoming consultation tokens, analyze medical symptoms with AI, and summarize lab reports instantly."}
          </p>
          <div className="pt-2 text-xs font-mono text-emerald-200/80">
            Clinic local time: {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Stats Summary Grid */}
      {user.role === 'admin' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono">Specialists</span>
              <p className="text-3xl font-bold text-slate-800 dark:text-white font-sans">{doctors.length}</p>
            </div>
            <div className="bg-blue-500/10 text-blue-500 p-4 rounded-xl border border-blue-500/15">
              <Stethoscope className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono">Registered Patients</span>
              <p className="text-3xl font-bold text-slate-800 dark:text-white font-sans">{patients.length}</p>
            </div>
            <div className="bg-emerald-500/10 text-emerald-500 p-4 rounded-xl border border-emerald-500/15">
              <Users className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono">Active Bookings</span>
              <p className="text-3xl font-bold text-slate-800 dark:text-white font-sans">{activeAppointments.length}</p>
            </div>
            <div className="bg-violet-500/10 text-violet-500 p-4 rounded-xl border border-violet-500/15">
              <Calendar className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono">Live Waiting Queue</span>
              <p className="text-3xl font-bold text-slate-800 dark:text-white font-sans">{activeQueue.length}</p>
            </div>
            <div className="bg-amber-500/10 text-amber-500 p-4 rounded-xl border border-amber-500/15">
              <Activity className="h-6 w-6 animate-pulse" />
            </div>
          </div>
        </div>
      )}

      {user.role === 'doctor' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono">My Queue Count</span>
              <p className="text-3xl font-bold text-slate-800 dark:text-white font-sans">
                {queue.filter(q => q.doctorId === user.profileId && q.status === 'waiting').length}
              </p>
            </div>
            <div className="bg-amber-500/10 text-amber-500 p-4 rounded-xl">
              <Activity className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono">Today's Appointments</span>
              <p className="text-3xl font-bold text-slate-800 dark:text-white font-sans">
                {appointments.filter(a => a.doctorId === user.profileId && a.date === todayStr).length}
              </p>
            </div>
            <div className="bg-emerald-500/10 text-emerald-500 p-4 rounded-xl">
              <Calendar className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono">Cons. Fee</span>
              <p className="text-3xl font-bold text-slate-800 dark:text-white font-sans">
                ${doctors.find(d => d.id === user.profileId)?.consultationFee || 0}
              </p>
            </div>
            <div className="bg-blue-500/10 text-blue-500 p-4 rounded-xl">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
        </div>
      )}

      {user.role === 'patient' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono">My Upcoming Appts</span>
              <p className="text-3xl font-bold text-slate-800 dark:text-white font-sans">
                {appointments.filter(a => a.patientId === user.profileId && (a.status === 'booked' || a.status === 'rescheduled')).length}
              </p>
            </div>
            <div className="bg-violet-500/10 text-violet-500 p-4 rounded-xl">
              <Calendar className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono">My Queue Position</span>
              <p className="text-3xl font-bold text-slate-800 dark:text-white font-sans">
                {queue.findIndex(q => q.patientId === user.profileId && q.status === 'waiting') !== -1
                  ? queue.findIndex(q => q.patientId === user.profileId && q.status === 'waiting') + 1
                  : 'N/A'}
              </p>
            </div>
            <div className="bg-amber-500/10 text-amber-500 p-4 rounded-xl">
              <Clock className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono">Consultation Fee</span>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 font-sans mt-2">Paid on booking</p>
            </div>
            <div className="bg-emerald-500/10 text-emerald-500 p-4 rounded-xl">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Dynamic Workspace Area */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Active Consultation / Call next panel for Doctors */}
          {user.role === 'doctor' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-sans font-bold text-lg text-slate-800 dark:text-white">Live Patient Consultation Handler</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Manage queue progression for patients assigned to you today.</p>
                </div>
                {activeConsultation ? (
                  <span className="bg-red-500/10 text-red-500 border border-red-500/15 text-[10px] font-mono font-bold tracking-wider uppercase px-2.5 py-1 rounded-full flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5 animate-pulse" />
                    IN CONSULTATION
                  </span>
                ) : (
                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-mono font-bold tracking-wider uppercase px-2.5 py-1 rounded-full">
                    IDLE QUEUE
                  </span>
                )}
              </div>

              {activeConsultation ? (
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-600 font-bold">Active Patient</span>
                    <h4 className="font-sans font-bold text-base text-slate-800 dark:text-white">{activeConsultation.patientName}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <span>Token Number: <strong className="text-slate-700 dark:text-white">#{activeConsultation.tokenNumber}</strong></span>
                      <span>•</span>
                      <span>Status: <strong className="text-amber-500 capitalize">{activeConsultation.status}</strong></span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCallNext}
                      disabled={callingNext}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Complete & Call Next
                    </button>
                    <button
                      onClick={() => onSkipPatient(activeConsultation.appointmentId)}
                      className="border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5"
                    >
                      Skip / Absent
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-center space-y-4">
                  <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full w-fit mx-auto text-slate-400">
                    <UserIcon className="h-6 w-6" />
                  </div>
                  <div className="space-y-1 max-w-sm mx-auto">
                    <h4 className="font-bold text-sm text-slate-700 dark:text-white">No Patient Currently in Consultation</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Call the next waiting patient from your active queue directory.
                    </p>
                  </div>
                  <button
                    onClick={handleCallNext}
                    disabled={callingNext || queue.filter(q => q.doctorId === user.profileId && q.status === 'waiting').length === 0}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5 mx-auto disabled:opacity-40"
                  >
                    <Play className="h-4 w-4" />
                    Call Next Waiting Patient
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Today's Appointments List */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-150 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-sans font-bold text-lg text-slate-800 dark:text-white">
                  {user.role === 'doctor' ? "Today's Clinical Appointments" : "Upcoming Scheduled Appointments"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {user.role === 'doctor' ? "Overview of schedule slots reserved for today" : "List of pending consultations registered under your profile."}
                </p>
              </div>
              <button 
                onClick={() => setActiveTab('appointments')}
                className="text-emerald-600 hover:text-emerald-500 text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                View Full Calendar
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {todayAppointments.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Calendar className="h-10 w-10 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  No appointments scheduled for today. Have a peaceful clinical shift!
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {todayAppointments.map(apt => (
                  <div key={apt.id} className="p-4 flex items-center justify-between hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 px-3 py-2 rounded-xl text-center">
                        <Clock className="h-4 w-4 mx-auto" />
                        <span className="text-[10px] font-mono font-bold block mt-0.5">{apt.timeSlot}</span>
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-semibold text-slate-800 dark:text-white">
                          {user.role === 'doctor' ? apt.patientName : apt.doctorName}
                        </h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                          <span>Token Number: <strong>#{apt.tokenNumber || 'N/A'}</strong></span>
                          <span>•</span>
                          <span className="capitalize text-emerald-500 font-medium">{apt.status}</span>
                        </p>
                      </div>
                    </div>
                    {user.role === 'doctor' && apt.status === 'booked' && (
                      <button
                        onClick={handleCallNext}
                        className="bg-emerald-600/10 text-emerald-600 hover:bg-emerald-600 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      >
                        Call Consult
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick AI Action Bento Panel */}
          {user.role === 'patient' && (
            <div className="space-y-4">
              <h3 className="font-sans font-bold text-lg text-slate-800 dark:text-white">AI Health Suites</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('symptoms')}
                  className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm text-left hover:border-emerald-500/40 dark:hover:border-emerald-500/40 hover:shadow-md transition-all group"
                >
                  <div className="bg-blue-500/10 text-blue-500 p-3 rounded-xl w-fit mb-4">
                    <Stethoscope className="h-5 w-5" />
                  </div>
                  <h4 className="font-semibold text-sm text-slate-800 dark:text-white group-hover:text-emerald-500 transition-colors">Symptom Checker</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Check clinical urgency and recommended departments.</p>
                </button>

                <button
                  onClick={() => setActiveTab('summarizer')}
                  className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm text-left hover:border-emerald-500/40 dark:hover:border-emerald-500/40 hover:shadow-md transition-all group"
                >
                  <div className="bg-violet-500/10 text-violet-500 p-3 rounded-xl w-fit mb-4">
                    <FileText className="h-5 w-5" />
                  </div>
                  <h4 className="font-semibold text-sm text-slate-800 dark:text-white group-hover:text-emerald-500 transition-colors">Report Summarizer</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Instantly summarize heavy medical files/PDFs.</p>
                </button>

                <button
                  onClick={() => setActiveTab('chatbot')}
                  className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm text-left hover:border-emerald-500/40 dark:hover:border-emerald-500/40 hover:shadow-md transition-all group"
                >
                  <div className="bg-emerald-500/10 text-emerald-500 p-3 rounded-xl w-fit mb-4">
                    <Activity className="h-5 w-5" />
                  </div>
                  <h4 className="font-semibold text-sm text-slate-800 dark:text-white group-hover:text-emerald-500 transition-colors">Hospital Assistant</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Ask FAQ bots about specialists, clinics & schedules.</p>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Right Side: Hospital Live Queue Tracking & Interactive Widget */}
        <div className="space-y-8">
          
          <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-400 animate-pulse" />
                <h3 className="font-sans font-bold text-base">Live Queue Monitor</h3>
              </div>
              <span className="text-[10px] font-mono tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full uppercase">Realtime</span>
            </div>

            {/* Current in consultation overview */}
            {activeConsultation ? (
              <div className="bg-slate-950/60 p-4 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase tracking-wider font-mono text-emerald-400 font-bold">Now Consulted</span>
                  <span className="text-xs font-mono text-emerald-400">Room 04</span>
                </div>
                <h4 className="font-sans font-bold text-sm text-white">{activeConsultation.patientName}</h4>
                <p className="text-xs text-slate-400">Doctor: <strong className="text-slate-200">{activeConsultation.doctorName}</strong></p>
                <p className="text-xs text-slate-400">Token Number: <strong className="text-emerald-400 font-mono">#{activeConsultation.tokenNumber}</strong></p>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-950/40 text-center text-slate-400 text-xs border border-dashed border-slate-800">
                No active consultation registered.
              </div>
            )}

            {/* General Queue wait list */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Up Next in Clinic</h4>
              
              {activeQueue.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Queue is clear! Perfect.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                  {activeQueue.map((item, index) => (
                    <div key={item.appointmentId} className="bg-slate-800/40 p-3 rounded-xl flex items-center justify-between border border-slate-800">
                      <div>
                        <h5 className="text-xs font-semibold text-slate-100">{item.patientName}</h5>
                        <p className="text-[10px] text-slate-400">Dr. {item.doctorName.split(' ')[2] || item.doctorName}</p>
                      </div>
                      <div className="text-right">
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono px-2 py-0.5 rounded-md">
                          Token #{item.tokenNumber}
                        </span>
                        <p className="text-[9px] text-slate-400 mt-1">Wait ~{item.estimatedWaitTime} min</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setActiveTab('queue')}
              className="w-full text-center py-2 text-xs font-bold text-emerald-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-all border border-emerald-500/20"
            >
              Manage Live Queue Tracker
            </button>
          </div>

          {/* Quick FAQ info panel */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm space-y-4">
            <h4 className="font-sans font-bold text-sm text-slate-800 dark:text-white flex items-center gap-1.5">
              <HelpCircle className="h-4.5 w-4.5 text-blue-500" />
              Frequently Asked Questions
            </h4>
            <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-400">
              <div className="space-y-1">
                <p className="font-semibold text-slate-700 dark:text-slate-300">How do I access live queue tokens?</p>
                <p className="font-light">Once an appointment is booked for today, a live token is auto-assigned. View queue state on the Live Queue Tracker tab.</p>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-slate-700 dark:text-slate-300">Are the AI tools medically binding?</p>
                <p className="font-light text-rose-500">No. All AI features are diagnostic aids. In case of emergency please visit local ER units immediately.</p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

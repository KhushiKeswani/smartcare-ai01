import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Plus, 
  X, 
  AlertTriangle, 
  Check, 
  User as UserIcon, 
  Stethoscope, 
  CalendarDays,
  RefreshCw,
  Eye
} from 'lucide-react';
import { User, Doctor, Appointment, Patient } from '../types';

interface AppointmentsProps {
  user: User;
  doctors: Doctor[];
  patients: Patient[];
  appointments: Appointment[];
  onBookAppointment: (booking: { doctorId: string; date: string; timeSlot: string; patientId?: string }) => Promise<void>;
  onUpdateAppointment: (id: string, updates: { date?: string; timeSlot?: string; status?: string }) => Promise<void>;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

export default function Appointments({
  user,
  doctors,
  patients,
  appointments,
  onBookAppointment,
  onUpdateAppointment,
  showToast
}: AppointmentsProps) {
  const [showBookModal, setShowBookModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);

  // Form states
  const [doctorId, setDoctorId] = useState('');
  const [patientId, setPatientId] = useState(''); // for admin walk-in booking
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState('');

  // Define available clinic timeslots
  const defaultSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
  ];

  // Derive filtered appointments
  const filteredAppointments = appointments.filter(a => {
    if (user.role === 'admin') return true;
    if (user.role === 'doctor') return a.doctorId === user.profileId;
    return a.patientId === user.profileId;
  });

  const getDoctorName = (id: string) => doctors.find(d => d.id === id)?.name || 'Unknown Doctor';
  const getPatientName = (id: string) => patients.find(p => p.id === id)?.name || 'Unknown Patient';

  // Conflict Checker: helper to see if a slot is already booked for selected doctor & date
  const isSlotBooked = (docId: string, checkDate: string, checkSlot: string) => {
    return appointments.some(
      a => a.doctorId === docId && a.date === checkDate && a.timeSlot === checkSlot && a.status === 'booked'
    );
  };

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorId || !date || !timeSlot) {
      showToast('Please select a doctor, date, and timeslot', 'error');
      return;
    }

    try {
      await onBookAppointment({
        doctorId,
        date,
        timeSlot,
        patientId: user.role === 'admin' ? patientId : undefined
      });
      setShowBookModal(false);
      setDoctorId('');
      setTimeSlot('');
    } catch (err: any) {
      // Conflict alerts or other messages handled
    }
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApt || !date || !timeSlot) return;

    try {
      await onUpdateAppointment(selectedApt.id, {
        date,
        timeSlot,
        status: 'rescheduled'
      });
      setShowRescheduleModal(false);
      setSelectedApt(null);
    } catch (err: any) {}
  };

  const handleCancelAppointment = async (id: string) => {
    if (window.confirm('Are you sure you want to cancel this appointment? This slot will be released.')) {
      try {
        await onUpdateAppointment(id, { status: 'cancelled' });
        showToast('Appointment cancelled successfully', 'success');
      } catch (err: any) {
        showToast(err.message || 'Failed to cancel appointment', 'error');
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-sans font-bold text-2xl text-slate-800 dark:text-white">Consultation Calendar & Appointments</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">View real-time clinician availability, check schedule slot conflicts, and manage bookings.</p>
        </div>

        {user.role !== 'doctor' && (
          <button
            onClick={() => {
              setDoctorId(doctors[0]?.id || '');
              setPatientId(patients[0]?.id || '');
              setDate(new Date().toISOString().split('T')[0]);
              setTimeSlot('');
              setShowBookModal(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold py-2.5 px-4 rounded-xl shadow-md transition-all flex items-center gap-2 active:scale-95"
          >
            <Plus className="h-5 w-5" />
            Book New Appointment
          </button>
        )}
      </div>

      {/* Appointment Listings */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-150 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
          <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest">Appointment Registry</span>
          <span className="text-xs text-slate-500">{filteredAppointments.length} Bookings Total</span>
        </div>

        {filteredAppointments.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full w-fit mx-auto text-slate-400">
              <CalendarDays className="h-8 w-8" />
            </div>
            <div className="max-w-xs mx-auto space-y-1">
              <h4 className="font-bold text-sm text-slate-700 dark:text-white">No Consultations Registered</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">There are no active bookings registered under this clinical profile.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/60 dark:bg-slate-950/40 border-b border-slate-150 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[10px] font-mono">
                  <th className="p-4">Doctor</th>
                  <th className="p-4">Patient</th>
                  <th className="p-4">Date & Time</th>
                  <th className="p-4">Queue Token</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredAppointments.map(apt => (
                  <tr key={apt.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="p-4 font-medium text-slate-800 dark:text-white flex items-center gap-2">
                      <Stethoscope className="h-4 w-4 text-emerald-500" />
                      {apt.doctorName}
                    </td>
                    <td className="p-4 text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4 text-slate-400" />
                        {apt.patientName}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-0.5">
                        <p className="font-semibold text-slate-800 dark:text-white">{apt.date}</p>
                        <p className="text-slate-400 font-mono text-[10px]">{apt.timeSlot}</p>
                      </div>
                    </td>
                    <td className="p-4 font-mono font-bold text-slate-700 dark:text-white">
                      {apt.tokenNumber ? `#${apt.tokenNumber}` : 'N/A'}
                    </td>
                    <td className="p-4">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-mono font-bold uppercase ${
                        apt.status === 'booked' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' :
                        apt.status === 'rescheduled' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' :
                        apt.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' :
                        'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                      }`}>
                        {apt.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedApt(apt);
                              setDate(apt.date);
                              setTimeSlot(apt.timeSlot);
                              setDoctorId(apt.doctorId);
                              setShowRescheduleModal(true);
                            }}
                            className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-500/10 dark:hover:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-800 transition-all flex items-center gap-1 text-[11px] font-semibold"
                            title="Reschedule Booking"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                            Reschedule
                          </button>
                          <button
                            onClick={() => handleCancelAppointment(apt.id)}
                            className="p-2 text-red-500 hover:text-white hover:bg-red-500 rounded-lg border border-transparent transition-colors"
                            title="Cancel Booking"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* BOOK APPOINTMENT MODAL */}
      {showBookModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg shadow-2xl p-6 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="font-sans font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-emerald-500" />
                  Book Clinical Consultation
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Select a specialist, date, and verify conflict-free timeslots.</p>
              </div>
              <button onClick={() => setShowBookModal(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleBookSubmit} className="space-y-4">
              {/* Doctor selection */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Select Specialist Clinician</label>
                <select
                  required
                  value={doctorId}
                  onChange={e => setDoctorId(e.target.value)}
                  className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="" disabled>Select Doctor...</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.department} - {d.specialization})
                    </option>
                  ))}
                </select>
              </div>

              {/* Admin Mode - patient selection */}
              {user.role === 'admin' && (
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Select Patient Profile</label>
                  <select
                    required
                    value={patientId}
                    onChange={e => setPatientId(e.target.value)}
                    className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                  >
                    <option value="" disabled>Select Patient...</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Age {p.age})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Date selection */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Select Date</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white focus:outline-none"
                />
              </div>

              {/* Timeslots conflict grid */}
              {doctorId && date && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      Select Consultation Slot
                    </h4>
                    <span className="text-[10px] text-slate-400">Slots are 30 mins</span>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {defaultSlots.map(slot => {
                      const booked = isSlotBooked(doctorId, date, slot);
                      const isSelected = timeSlot === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          disabled={booked}
                          onClick={() => setTimeSlot(slot)}
                          className={`py-2 px-1 text-center rounded-lg border text-xs font-mono font-semibold transition-all ${
                            booked 
                              ? 'bg-red-50 text-red-300 dark:bg-red-500/10 dark:text-red-500/40 border-transparent cursor-not-allowed line-through' 
                              : isSelected
                                ? 'bg-emerald-600 text-white border-transparent shadow-sm'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:text-emerald-500'
                          }`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>

                  {/* Conflict advisory message */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 flex gap-2 text-[11px] text-slate-500 leading-relaxed">
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                    <span>Red lined timeslots indicate existing consult conflict. Conflict detection is live.</span>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="px-4 py-2 text-xs font-bold border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!timeSlot}
                  className="px-5 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md disabled:opacity-50"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESCHEDULE APPOINTMENT MODAL */}
      {showRescheduleModal && selectedApt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="font-sans font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-emerald-500" />
                  Reschedule Appointment
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Moving schedule registry for patient: {selectedApt.patientName}</p>
              </div>
              <button onClick={() => { setShowRescheduleModal(false); setSelectedApt(null); }} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleRescheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Specialist assigned</label>
                <input
                  type="text"
                  disabled
                  value={getDoctorName(doctorId)}
                  className="w-full p-2.5 text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 disabled:opacity-80"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Select New Date</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                />
              </div>

              {/* Grid timeslots */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  Select New Consultation Slot
                </h4>

                <div className="grid grid-cols-4 gap-2">
                  {defaultSlots.map(slot => {
                    const booked = isSlotBooked(doctorId, date, slot);
                    const isSelected = timeSlot === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        disabled={booked}
                        onClick={() => setTimeSlot(slot)}
                        className={`py-2 px-1 text-center rounded-lg border text-xs font-mono font-semibold transition-all ${
                          booked 
                            ? 'bg-red-50 text-red-300 dark:bg-red-500/10 dark:text-red-500/40 border-transparent cursor-not-allowed line-through' 
                            : isSelected
                              ? 'bg-emerald-600 text-white border-transparent'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:text-emerald-500'
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => { setShowRescheduleModal(false); setSelectedApt(null); }}
                  className="px-4 py-2 text-xs font-bold border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!timeSlot}
                  className="px-5 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md disabled:opacity-50"
                >
                  Confirm Reschedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

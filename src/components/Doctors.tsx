import React, { useState } from 'react';
import { 
  Stethoscope, 
  Award, 
  DollarSign, 
  Calendar, 
  Plus, 
  Trash2, 
  Edit, 
  X, 
  Check, 
  Briefcase, 
  ShieldAlert, 
  BookOpen, 
  Star,
  Users
} from 'lucide-react';
import { User, Doctor, WeeklyScheduleItem } from '../types';

interface DoctorsProps {
  user: User;
  doctors: Doctor[];
  onAddDoctor: (doc: any) => Promise<void>;
  onUpdateDoctor: (id: string, doc: any) => Promise<void>;
  onDeleteDoctor: (id: string) => Promise<void>;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

export default function Doctors({
  user,
  doctors,
  onAddDoctor,
  onUpdateDoctor,
  onDeleteDoctor,
  showToast
}: DoctorsProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  // Form attributes
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('General Medicine');
  const [specialization, setSpecialization] = useState('');
  const [experience, setExperience] = useState('5');
  const [consultationFee, setConsultationFee] = useState('80');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [bio, setBio] = useState('');
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklyScheduleItem[]>([
    { day: 'Monday', start: '09:00', end: '17:00', active: true },
    { day: 'Tuesday', start: '09:00', end: '17:00', active: true },
    { day: 'Wednesday', start: '09:00', end: '17:00', active: true },
    { day: 'Thursday', start: '09:00', end: '17:00', active: true },
    { day: 'Friday', start: '09:00', end: '17:00', active: true },
    { day: 'Saturday', start: '09:00', end: '13:00', active: false },
    { day: 'Sunday', start: '09:00', end: '12:00', active: false },
  ]);

  const resetForm = () => {
    setName('');
    setEmail('');
    setDepartment('General Medicine');
    setSpecialization('');
    setExperience('5');
    setConsultationFee('80');
    setLicenseNumber('');
    setBio('');
    setWeeklySchedule([
      { day: 'Monday', start: '09:00', end: '17:00', active: true },
      { day: 'Tuesday', start: '09:00', end: '17:00', active: true },
      { day: 'Wednesday', start: '09:00', end: '17:00', active: true },
      { day: 'Thursday', start: '09:00', end: '17:00', active: true },
      { day: 'Friday', start: '09:00', end: '17:00', active: true },
      { day: 'Saturday', start: '09:00', end: '13:00', active: false },
      { day: 'Sunday', start: '09:00', end: '12:00', active: false },
    ]);
  };

  const handleOpenEdit = (doc: Doctor) => {
    setSelectedDoctor(doc);
    setName(doc.name);
    setEmail(doc.email);
    setDepartment(doc.department);
    setSpecialization(doc.specialization);
    setExperience(String(doc.experience));
    setConsultationFee(String(doc.consultationFee));
    setLicenseNumber(doc.licenseNumber);
    setBio(doc.bio || '');
    setWeeklySchedule(doc.weeklySchedule || []);
    setShowEditModal(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !specialization || !licenseNumber) {
      showToast('Please fill out all required fields', 'error');
      return;
    }

    try {
      await onAddDoctor({
        name,
        email,
        department,
        specialization,
        experience: Number(experience),
        consultationFee: Number(consultationFee),
        licenseNumber,
        bio,
        weeklySchedule
      });
      setShowAddModal(false);
      resetForm();
    } catch (err: any) {
      showToast(err.message || 'Failed to add doctor profile', 'error');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor) return;

    try {
      await onUpdateDoctor(selectedDoctor.id, {
        name,
        email,
        department,
        specialization,
        experience: Number(experience),
        consultationFee: Number(consultationFee),
        licenseNumber,
        bio,
        weeklySchedule
      });
      setShowEditModal(false);
      setSelectedDoctor(null);
      resetForm();
    } catch (err: any) {
      showToast(err.message || 'Failed to update doctor profile', 'error');
    }
  };

  const handleToggleScheduleDay = (index: number) => {
    const updated = [...weeklySchedule];
    updated[index].active = !updated[index].active;
    setWeeklySchedule(updated);
  };

  const handleScheduleTimeChange = (index: number, field: 'start' | 'end', val: string) => {
    const updated = [...weeklySchedule];
    updated[index][field] = val;
    setWeeklySchedule(updated);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this doctor profile? This is irreversible.')) {
      try {
        await onDeleteDoctor(id);
      } catch (err: any) {
        showToast(err.message || 'Failed to delete doctor profile', 'error');
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Directory Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-sans font-bold text-2xl text-slate-800 dark:text-white">Specialists & Clinicians Directory</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">List of modern licensed clinicians, certifications, and active consultation availability.</p>
        </div>

        {user.role === 'admin' && (
          <button
            onClick={() => { resetForm(); setShowAddModal(true); }}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold py-2.5 px-4 rounded-xl shadow-md shadow-emerald-600/10 transition-all flex items-center gap-2 active:scale-95"
          >
            <Plus className="h-5 w-5" />
            Register New Clinician
          </button>
        )}
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {doctors.map(doc => {
          const isOwnProfile = user.profileId === doc.id;
          const showManageButtons = user.role === 'admin' || isOwnProfile;
          return (
            <div key={doc.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col justify-between">
              
              {/* Profile Card Header */}
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-3 rounded-full border border-emerald-500/20 shrink-0">
                      <Stethoscope className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-sans font-bold text-base text-slate-800 dark:text-white flex items-center gap-1.5">
                        {doc.name}
                        {isOwnProfile && (
                          <span className="bg-emerald-500/10 text-emerald-600 text-[9px] uppercase font-mono px-2 py-0.5 rounded font-bold">You</span>
                        )}
                      </h3>
                      <p className="text-xs font-mono font-bold text-emerald-600 uppercase tracking-wider">{doc.department}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-light mt-0.5">{doc.specialization}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded text-xs font-semibold">
                    <Star className="h-3.5 w-3.5 fill-amber-500" />
                    {doc.rating || 5.0}
                  </div>
                </div>

                {/* Properties */}
                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="space-y-0.5">
                    <span className="text-slate-400 block font-light text-[10px] uppercase">Experience</span>
                    <p className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                      <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                      {doc.experience} Years
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-slate-400 block font-light text-[10px] uppercase">Consultation Fee</span>
                    <p className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                      <DollarSign className="h-3.5 w-3.5" />
                      {doc.consultationFee}
                    </p>
                  </div>
                  <div className="col-span-2 space-y-0.5 border-t border-slate-100 dark:border-slate-800/80 pt-2 mt-1">
                    <span className="text-slate-400 block font-light text-[10px] uppercase">License Registration ID</span>
                    <p className="font-mono text-slate-700 dark:text-slate-300 flex items-center gap-1 font-semibold">
                      <Award className="h-3.5 w-3.5 text-slate-400" />
                      {doc.licenseNumber}
                    </p>
                  </div>
                </div>

                {/* Bio text */}
                {doc.bio && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-light line-clamp-3 leading-relaxed border-t border-slate-100 dark:border-slate-800/80 pt-3">
                    {doc.bio}
                  </p>
                )}
              </div>

              {/* Weekly Availability Schedule list */}
              <div className="bg-slate-50/50 dark:bg-slate-950/20 border-t border-b border-slate-100 dark:border-slate-800 p-4 space-y-2">
                <span className="text-[10px] uppercase text-slate-400 tracking-wider font-semibold block flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  Active Consult Hours
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {doc.weeklySchedule?.map(sched => (
                    <span 
                      key={sched.day} 
                      className={`text-[9px] font-medium px-2 py-1 rounded-md border ${
                        sched.active 
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                          : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 border-transparent line-through'
                      }`}
                      title={sched.active ? `${sched.start} - ${sched.end}` : 'Off duty'}
                    >
                      {sched.day.substring(0, 3)}
                    </span>
                  ))}
                </div>
              </div>

              {/* Profile Card Footer */}
              {showManageButtons && (
                <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-150 dark:border-slate-800 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleOpenEdit(doc)}
                    className="p-2 text-slate-600 dark:text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-800 transition-all flex items-center gap-1.5 text-xs font-semibold"
                    title="Edit Profile"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    Manage Profile
                  </button>
                  {user.role === 'admin' && (
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-2 text-red-500 hover:text-white hover:bg-red-500 rounded-lg border border-red-500/20 transition-all"
                      title="Delete Doctor"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )}

            </div>
          );
        })}
      </div>

      {/* ADD CLINICIAN MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="font-sans font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-emerald-500" />
                  Register New Clinician
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Complete formal board certifications, credential details and license numbers.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Clinician Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Dr. Alexander Fleming"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="clinician@smartcare.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Clinical Department</label>
                  <select
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                  >
                    <option>General Medicine</option>
                    <option>Cardiology</option>
                    <option>Pediatrics</option>
                    <option>Neurology</option>
                    <option>Dermatology</option>
                    <option>Orthopedics</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Specialization Focus</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Preventive Cardiology"
                    value={specialization}
                    onChange={e => setSpecialization(e.target.value)}
                    className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Exp (Years)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={experience}
                    onChange={e => setExperience(e.target.value)}
                    className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Consultation Fee ($)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={consultationFee}
                    onChange={e => setConsultationFee(e.target.value)}
                    className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">License Registration ID Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MD-901842"
                  value={licenseNumber}
                  onChange={e => setLicenseNumber(e.target.value)}
                  className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Clinician Bio Summary</label>
                <textarea
                  placeholder="Summary of medical school, career history, specialty experience..."
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white focus:outline-none"
                />
              </div>

              {/* Schedule config */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Weekly Duty Hours Availability</h4>
                <div className="space-y-2">
                  {weeklySchedule.map((sched, index) => (
                    <div key={sched.day} className="flex items-center justify-between text-xs p-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800/80">
                      <label className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300 w-24">
                        <input
                          type="checkbox"
                          checked={sched.active}
                          onChange={() => handleToggleScheduleDay(index)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        {sched.day}
                      </label>
                      
                      {sched.active ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={sched.start}
                            onChange={e => handleScheduleTimeChange(index, 'start', e.target.value)}
                            className="bg-white dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 rounded"
                          />
                          <span className="text-slate-400">to</span>
                          <input
                            type="time"
                            value={sched.end}
                            onChange={e => handleScheduleTimeChange(index, 'end', e.target.value)}
                            className="bg-white dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 rounded"
                          />
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Off duty / Not active</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md"
                >
                  Register Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CLINICIAN MODAL */}
      {showEditModal && selectedDoctor && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="font-sans font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                  <Edit className="h-5 w-5 text-emerald-500" />
                  Manage Specialist Profile: {selectedDoctor.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Update clinician credentials, professional bios, and duty availabilities.</p>
              </div>
              <button onClick={() => { setShowEditModal(false); setSelectedDoctor(null); }} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Clinician Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    disabled={user.role !== 'admin'}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Clinical Department</label>
                  <select
                    value={department}
                    disabled={user.role !== 'admin'}
                    onChange={e => setDepartment(e.target.value)}
                    className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white disabled:opacity-50"
                  >
                    <option>General Medicine</option>
                    <option>Cardiology</option>
                    <option>Pediatrics</option>
                    <option>Neurology</option>
                    <option>Dermatology</option>
                    <option>Orthopedics</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Specialization Focus</label>
                  <input
                    type="text"
                    required
                    value={specialization}
                    onChange={e => setSpecialization(e.target.value)}
                    className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Exp (Years)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={experience}
                    onChange={e => setExperience(e.target.value)}
                    className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Consultation Fee ($)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={consultationFee}
                    onChange={e => setConsultationFee(e.target.value)}
                    className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">License Registration ID Number</label>
                <input
                  type="text"
                  required
                  disabled={user.role !== 'admin'}
                  value={licenseNumber}
                  onChange={e => setLicenseNumber(e.target.value)}
                  className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white font-mono disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Clinician Bio Summary</label>
                <textarea
                  placeholder="Summary of medical credentials..."
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white focus:outline-none"
                />
              </div>

              {/* Schedule config */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Weekly Duty Hours Availability</h4>
                <div className="space-y-2">
                  {weeklySchedule.map((sched, index) => (
                    <div key={sched.day} className="flex items-center justify-between text-xs p-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800/80">
                      <label className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300 w-24">
                        <input
                          type="checkbox"
                          checked={sched.active}
                          onChange={() => handleToggleScheduleDay(index)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        {sched.day}
                      </label>
                      
                      {sched.active ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={sched.start}
                            onChange={e => handleScheduleTimeChange(index, 'start', e.target.value)}
                            className="bg-white dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 rounded"
                          />
                          <span className="text-slate-400">to</span>
                          <input
                            type="time"
                            value={sched.end}
                            onChange={e => handleScheduleTimeChange(index, 'end', e.target.value)}
                            className="bg-white dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 rounded"
                          />
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Off duty / Not active</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setSelectedDoctor(null); }}
                  className="px-4 py-2 text-xs font-bold border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md"
                >
                  Save Profile Updates
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

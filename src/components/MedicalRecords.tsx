import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Search, 
  Calendar, 
  Activity, 
  Stethoscope, 
  FileCheck, 
  Heart, 
  Thermometer, 
  Scale, 
  Sparkles, 
  User as UserIcon, 
  X,
  PlusCircle,
  Filter,
  Layers,
  FileSignature
} from 'lucide-react';
import { User, Patient, Doctor, MedicalRecord } from '../types';

interface MedicalRecordsProps {
  user: User;
  patients: Patient[];
  doctors: Doctor[];
  records: MedicalRecord[];
  onCreateRecord: (recordData: Partial<MedicalRecord>) => Promise<void>;
  onUpdateRecord: (id: string, recordData: Partial<MedicalRecord>) => Promise<void>;
  onDeleteRecord: (id: string) => Promise<void>;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

export default function MedicalRecords({
  user,
  patients,
  doctors,
  records,
  onCreateRecord,
  onUpdateRecord,
  onDeleteRecord,
  showToast
}: MedicalRecordsProps) {
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');

  // Form states for creating a medical record
  const [diagnosis, setDiagnosis] = useState('');
  const [treatment, setTreatment] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [department, setDepartment] = useState('');
  const [bp, setBp] = useState('');
  const [hr, setHr] = useState('');
  const [temp, setTemp] = useState('');
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [formPatientId, setFormPatientId] = useState('');

  // Automatically select the patient's own ID if they are logged in as a patient
  useEffect(() => {
    if (user.role === 'patient') {
      setSelectedPatientId(user.profileId || '');
    } else if (patients.length > 0 && !selectedPatientId) {
      // Default select the first patient for doctor/admin view
      setSelectedPatientId(patients[0].id);
    }
  }, [user, patients]);

  // Derive records that match the selected patient and query filters
  const activePatientRecords = records.filter(rec => rec.patientId === selectedPatientId);

  // Filter records based on search and department
  const filteredRecords = activePatientRecords.filter(rec => {
    const matchesSearch = 
      rec.diagnosis.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.treatment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.symptoms.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDept = !filterDepartment || rec.department === filterDepartment;
    
    return matchesSearch && matchesDept;
  });

  // Unique departments available in this patient's records for filter dropdown
  const recordDepartments = Array.from(new Set(activePatientRecords.map(r => r.department)));

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const targetPatientId = user.role === 'patient' ? user.profileId : formPatientId;
    
    if (!targetPatientId) {
      showToast('Please select a patient.', 'error');
      return;
    }
    if (!diagnosis.trim()) {
      showToast('Diagnosis is required.', 'error');
      return;
    }
    if (!treatment.trim()) {
      showToast('Treatment plan is required.', 'error');
      return;
    }

    try {
      await onCreateRecord({
        patientId: targetPatientId,
        diagnosis,
        treatment,
        symptoms,
        department: department || 'General Medicine',
        vitals: {
          bloodPressure: bp || undefined,
          heartRate: hr || undefined,
          temperature: temp || undefined,
          weight: weight || undefined
        },
        notes
      });

      // Clear state
      setDiagnosis('');
      setTreatment('');
      setSymptoms('');
      setDepartment('');
      setBp('');
      setHr('');
      setTemp('');
      setWeight('');
      setNotes('');
      setShowAddModal(false);
      showToast('Medical record added successfully', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to add medical record', 'error');
    }
  };

  const getPatientName = (id: string) => {
    return patients.find(p => p.id === id)?.name || 'Unknown Patient';
  };

  const currentPatientObj = patients.find(p => p.id === selectedPatientId);

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="font-sans font-bold text-2xl text-slate-800 dark:text-white flex items-center gap-2.5">
            <FileCheck className="h-7 w-7 text-emerald-500" />
            Clinical Medical Records
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {user.role === 'patient' 
              ? 'Review your comprehensive chronological consultation logs, clinical diagnoses, and prescriptions.' 
              : 'Access and manage patient medical summaries, diagnostic charts, and clinical records.'}
          </p>
        </div>

        {/* Action Button for Doctor/Admin */}
        {(user.role === 'doctor' || user.role === 'admin') && (
          <button
            onClick={() => {
              setFormPatientId(selectedPatientId);
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/15 transition-all self-start md:self-auto"
          >
            <Plus className="h-4 w-4" />
            Add Medical Record
          </button>
        )}
      </div>

      {/* Patient Selector Row (Doctors/Admins only) */}
      {(user.role === 'doctor' || user.role === 'admin') && patients.length > 0 && (
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <UserIcon className="h-4 w-4 text-emerald-500" />
            <span>Select Patient Profile:</span>
          </div>
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white min-w-[200px]"
          >
            {patients.map(p => (
              <option key={p.id} value={p.id}>{p.name} (Age: {p.age}, {p.gender})</option>
            ))}
          </select>
        </div>
      )}

      {/* Patient Header Summary Panel */}
      {currentPatientObj && (
        <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-2xl shadow-sm text-slate-100 flex flex-col md:flex-row justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="bg-emerald-500/20 text-emerald-400 p-1.5 rounded-full border border-emerald-500/10">
                <UserIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{currentPatientObj.name}</h3>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono font-semibold">ID: {currentPatientObj.id}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-400">
              <div>Age: <strong className="text-slate-200">{currentPatientObj.age}</strong></div>
              <div>Gender: <strong className="text-slate-200">{currentPatientObj.gender}</strong></div>
              <div>Phone: <strong className="text-slate-200">{currentPatientObj.phone}</strong></div>
              <div>Email: <strong className="text-slate-200">{currentPatientObj.email}</strong></div>
            </div>
          </div>
          <div className="flex-1 md:max-w-md bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
            <h4 className="text-xs font-semibold text-emerald-400 mb-1 flex items-center gap-1.5 font-mono uppercase tracking-wider">
              <Layers className="h-3.5 w-3.5" />
              Declared Medical History
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed font-light italic">
              "{currentPatientObj.medicalHistory || 'No declared medical history recorded.'}"
            </p>
          </div>
        </div>
      )}

      {/* Search and Category Filter Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search timeline diagnoses, prescriptions, doctors, symptoms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
          />
        </div>

        {recordDepartments.length > 0 && (
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="p-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
          >
            <option value="">All Departments</option>
            {recordDepartments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        )}
      </div>

      {/* Timeline view */}
      {filteredRecords.length > 0 ? (
        <div className="relative border-l border-slate-250 dark:border-slate-800 ml-4 md:ml-6 space-y-8 py-2">
          {filteredRecords.map((record, index) => {
            const hasVitals = record.vitals && Object.values(record.vitals).some(v => !!v);
            return (
              <div key={record.id} className="relative pl-6 md:pl-10 group animate-in fade-in-50 duration-300">
                {/* Timeline node */}
                <span className="absolute -left-3 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white dark:bg-slate-900 border-2 border-emerald-500 shadow-md group-hover:scale-110 transition-transform">
                  <Activity className="h-3 w-3 text-emerald-500" />
                </span>

                {/* Record card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl shadow-sm p-5 md:p-6 hover:shadow-md transition-shadow relative">
                  {/* Delete record (Admin only) */}
                  {user.role === 'admin' && (
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this clinical record?')) {
                          onDeleteRecord(record.id);
                        }
                      }}
                      className="absolute right-4 top-4 text-slate-400 hover:text-red-500 p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      title="Delete medical record"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}

                  {/* Header info */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-2 mb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                          {record.department}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {record.date}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 mt-1">
                        <Stethoscope className="h-3.5 w-3.5 text-slate-400" />
                        <span>Consulting Specialist: <strong className="text-slate-800 dark:text-white">{record.doctorName}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Content details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      {/* Diagnosis */}
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono mb-1">
                          Clinical Diagnosis
                        </h4>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">
                          {record.diagnosis}
                        </p>
                      </div>

                      {/* Treatment */}
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono mb-1">
                          Prescription & Treatment Plan
                        </h4>
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-light">
                          {record.treatment}
                        </p>
                      </div>

                      {/* Symptoms */}
                      {record.symptoms && (
                        <div>
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono mb-1">
                            Presented Symptoms
                          </h4>
                          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-light">
                            {record.symptoms}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      {/* Vitals Panel */}
                      {hasVitals && (
                        <div>
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono mb-2 flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                            Consultation Vitals
                          </h4>
                          <div className="grid grid-cols-2 gap-2.5">
                            {record.vitals?.bloodPressure && (
                              <div className="p-2.5 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800/80 flex items-center gap-2">
                                <Heart className="h-4 w-4 text-rose-500 shrink-0" />
                                <div className="min-w-0">
                                  <div className="text-[10px] text-slate-400 font-mono">B/P</div>
                                  <div className="text-xs font-bold text-slate-800 dark:text-white truncate">{record.vitals.bloodPressure}</div>
                                </div>
                              </div>
                            )}

                            {record.vitals?.heartRate && (
                              <div className="p-2.5 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800/80 flex items-center gap-2">
                                <Activity className="h-4 w-4 text-emerald-500 shrink-0" />
                                <div className="min-w-0">
                                  <div className="text-[10px] text-slate-400 font-mono">Pulse</div>
                                  <div className="text-xs font-bold text-slate-800 dark:text-white truncate">{record.vitals.heartRate}</div>
                                </div>
                              </div>
                            )}

                            {record.vitals?.temperature && (
                              <div className="p-2.5 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800/80 flex items-center gap-2">
                                <Thermometer className="h-4 w-4 text-amber-500 shrink-0" />
                                <div className="min-w-0">
                                  <div className="text-[10px] text-slate-400 font-mono">Temp</div>
                                  <div className="text-xs font-bold text-slate-800 dark:text-white truncate">{record.vitals.temperature}</div>
                                </div>
                              </div>
                            )}

                            {record.vitals?.weight && (
                              <div className="p-2.5 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800/80 flex items-center gap-2">
                                <Scale className="h-4 w-4 text-blue-500 shrink-0" />
                                <div className="min-w-0">
                                  <div className="text-[10px] text-slate-400 font-mono">Weight</div>
                                  <div className="text-xs font-bold text-slate-800 dark:text-white truncate">{record.vitals.weight}</div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Physician Notes */}
                      {record.notes && (
                        <div className="p-3.5 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-800/60 rounded-xl">
                          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                            <FileSignature className="h-3.5 w-3.5 text-emerald-500" />
                            Physician Clinical Notes
                          </h4>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-light italic">
                            "{record.notes}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-16 text-center space-y-4">
          <div className="bg-slate-100 dark:bg-slate-900 p-5 rounded-full w-fit mx-auto text-slate-400">
            <FileText className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-slate-700 dark:text-white">No Medical Records Listed</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              There are no recorded medical diagnostic summaries or treatment logs for this patient profile at this time.
            </p>
          </div>
          {(user.role === 'doctor' || user.role === 'admin') && (
            <button
              onClick={() => {
                setFormPatientId(selectedPatientId);
                setShowAddModal(true);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold"
            >
              Add First Record
            </button>
          )}
        </div>
      )}

      {/* Add Record Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-sans font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                <FileCheck className="h-5.5 w-5.5 text-emerald-500" />
                Add Patient Medical Record
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-5">
              {/* Select Patient (if not predefined) */}
              {(user.role === 'doctor' || user.role === 'admin') && !user.profileId && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest font-mono mb-1.5">
                    Target Patient Profile *
                  </label>
                  <select
                    value={formPatientId}
                    onChange={(e) => setFormPatientId(e.target.value)}
                    required
                    className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                  >
                    <option value="">-- Choose Patient --</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (ID: {p.id})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Diagnosis & Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest font-mono mb-1.5">
                    Clinical Diagnosis *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mild Allergic Asthma"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest font-mono mb-1.5">
                    Clinical Department
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Cardiology, Pediatrics, General"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                  />
                </div>
              </div>

              {/* Presented Symptoms */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest font-mono mb-1.5">
                  Presented Symptoms
                </label>
                <textarea
                  rows={2}
                  placeholder="Summarize symptoms described by the patient..."
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white font-light leading-relaxed"
                />
              </div>

              {/* Treatment / Prescription */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest font-mono mb-1.5">
                  Treatment Plan & Prescription *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detail medications, dosages, dietary guidelines, or clinical precautions..."
                  value={treatment}
                  onChange={(e) => setTreatment(e.target.value)}
                  className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white font-light leading-relaxed"
                />
              </div>

              {/* Vitals Panel Fields */}
              <div>
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest font-mono mb-2">
                  Patient Consultation Vitals (Optional)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <input
                      type="text"
                      placeholder="BP (e.g. 120/80)"
                      value={bp}
                      onChange={(e) => setBp(e.target.value)}
                      className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white font-mono"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Pulse (e.g. 72 bpm)"
                      value={hr}
                      onChange={(e) => setHr(e.target.value)}
                      className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white font-mono"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Temp (e.g. 98.6 °F)"
                      value={temp}
                      onChange={(e) => setTemp(e.target.value)}
                      className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white font-mono"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Weight (e.g. 70 kg)"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Physician Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest font-mono mb-1.5">
                  Internal Physician Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Private notes, next checkup advice, flags for care team..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white font-light leading-relaxed"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-lg shadow-emerald-600/15 transition-all"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

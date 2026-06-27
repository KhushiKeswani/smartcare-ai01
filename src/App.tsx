import React, { useState, useEffect } from 'react';
import { Activity, AlertCircle, CheckCircle, HelpCircle, X } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Doctors from './components/Doctors';
import Appointments from './components/Appointments';
import Queue from './components/Queue';
import AISymptomChecker from './components/AISymptomChecker';
import AIReportSummarizer from './components/AIReportSummarizer';
import AIAssistant from './components/AIAssistant';
import MedicalRecords from './components/MedicalRecords';
import { User, Doctor, Patient, Appointment, QueueItem, MedicalRecord } from './types';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [darkMode, setDarkMode] = useState<boolean>(true); // default to a premium dark mode feel

  // Global registries state
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [records, setRecords] = useState<MedicalRecord[]>([]);

  // Toast notifications list
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = `${Date.now()}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Synchronize Dark Mode Class on document element
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  // Attempt auto-login via localStorage session
  useEffect(() => {
    const storedToken = localStorage.getItem('smartcare_token');
    const storedUserStr = localStorage.getItem('smartcare_user');
    
    if (storedToken && storedUserStr) {
      try {
        const storedUser = JSON.parse(storedUserStr);
        setToken(storedToken);
        setUser(storedUser);
      } catch {
        localStorage.removeItem('smartcare_token');
        localStorage.removeItem('smartcare_user');
      }
    }
  }, []);

  // Sync data whenever authenticated user changes
  useEffect(() => {
    if (token) {
      fetchClinicalData();
    }
  }, [token]);

  const fetchClinicalData = async () => {
    if (!token) return;
    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      const [resDocs, resPatients, resAppts, resQueue, resRecords] = await Promise.all([
        fetch('/api/doctors', { headers }),
        fetch('/api/patients', { headers }),
        fetch('/api/appointments', { headers }),
        fetch('/api/queue', { headers }),
        fetch('/api/records', { headers })
      ]);

      if (resDocs.ok) setDoctors(await resDocs.json());
      if (resPatients.ok) setPatients(await resPatients.json());
      if (resAppts.ok) setAppointments(await resAppts.json());
      if (resQueue.ok) setQueue(await resQueue.json());
      if (resRecords.ok) setRecords(await resRecords.json());
    } catch (err) {
      console.error("Clinical sync failed", err);
      showToast('Clinical data synchronization offline', 'error');
    }
  };

  const handleAuthSuccess = (newToken: string, newUser: User) => {
    localStorage.setItem('smartcare_token', newToken);
    localStorage.setItem('smartcare_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('smartcare_token');
    localStorage.removeItem('smartcare_user');
    setToken(null);
    setUser(null);
    setDoctors([]);
    setPatients([]);
    setAppointments([]);
    setQueue([]);
    setRecords([]);
    showToast('Signed out successfully', 'success');
  };

  // --- Doctor Operations ---
  const onAddDoctor = async (docData: any) => {
    try {
      const response = await fetch('/api/doctors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(docData)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to register doctor');

      showToast(`Successfully registered ${data.name}!`, 'success');
      fetchClinicalData();
    } catch (err: any) {
      showToast(err.message || 'Error creating profile', 'error');
      throw err;
    }
  };

  const onUpdateDoctor = async (id: string, docData: any) => {
    try {
      const response = await fetch(`/api/doctors/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(docData)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update doctor profile');

      showToast(`Specialist profile updated successfully!`, 'success');
      fetchClinicalData();
    } catch (err: any) {
      showToast(err.message || 'Error updating profile', 'error');
      throw err;
    }
  };

  const onDeleteDoctor = async (id: string) => {
    try {
      const response = await fetch(`/api/doctors/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete doctor profile');

      showToast('Specialist profile deleted', 'success');
      fetchClinicalData();
    } catch (err: any) {
      showToast(err.message || 'Error deleting profile', 'error');
      throw err;
    }
  };

  // --- Appointment Operations ---
  const onBookAppointment = async (booking: { doctorId: string; date: string; timeSlot: string; patientId?: string }) => {
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(booking)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Conflict or scheduling error');
      }

      showToast(`Appointment booked! Token #${data.tokenNumber} assigned.`, 'success');
      fetchClinicalData();
    } catch (err: any) {
      showToast(err.message || 'Conflict detected or booking failed.', 'error');
      throw err;
    }
  };

  const onUpdateAppointment = async (id: string, updates: { date?: string; timeSlot?: string; status?: string }) => {
    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Scheduling modification failed');

      if (updates.status === 'cancelled') {
        showToast('Consultation appointment cancelled', 'success');
      } else {
        showToast('Rescheduled successfully!', 'success');
      }
      fetchClinicalData();
    } catch (err: any) {
      showToast(err.message || 'Rescheduling error', 'error');
      throw err;
    }
  };

  // --- Queue Operations ---
  const onCallNextPatient = async (doctorId: string) => {
    try {
      const response = await fetch('/api/queue/call-next', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ doctorId })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to manage queue');

      if (data.nextActive) {
        showToast(`Room Active: Now calling patient ${data.nextActive.patientName}`, 'success');
      } else {
        showToast('Completed current. No waiting patients in pipeline.', 'success');
      }
      fetchClinicalData();
    } catch (err: any) {
      showToast(err.message || 'Error updating queue flow', 'error');
      throw err;
    }
  };

  const onSkipPatient = async (appointmentId: string) => {
    try {
      const response = await fetch('/api/queue/skip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ appointmentId })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Skip item operation failed');

      showToast('Patient marked as absent/skipped', 'success');
      fetchClinicalData();
    } catch (err: any) {
      showToast(err.message || 'Error skipping patient queue position', 'error');
      throw err;
    }
  };

  const onGenerateWalkInToken = async (walkIn: { doctorId: string; patientName: string; patientPhone?: string }) => {
    try {
      const response = await fetch('/api/queue/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(walkIn)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to issue token');

      showToast(`Walk-In registered successfully! Token #${data.tokenNumber} issued.`, 'success');
      fetchClinicalData();
    } catch (err: any) {
      showToast(err.message || 'Error generating token', 'error');
      throw err;
    }
  };

  // --- Medical Records Operations ---
  const onCreateRecord = async (recordData: Partial<MedicalRecord>) => {
    try {
      const response = await fetch('/api/records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(recordData)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create medical record');

      fetchClinicalData();
    } catch (err: any) {
      showToast(err.message || 'Error creating medical record', 'error');
      throw err;
    }
  };

  const onUpdateRecord = async (id: string, recordData: Partial<MedicalRecord>) => {
    try {
      const response = await fetch(`/api/records/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(recordData)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update medical record');

      fetchClinicalData();
      showToast('Medical record updated successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error updating medical record', 'error');
      throw err;
    }
  };

  const onDeleteRecord = async (id: string) => {
    try {
      const response = await fetch(`/api/records/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete medical record');

      fetchClinicalData();
      showToast('Medical record deleted successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error deleting medical record', 'error');
      throw err;
    }
  };

  // Symptom checker action redirect to scheduling
  const handleSymptomBookRedirect = (doctorId: string) => {
    setActiveTab('appointments');
    showToast('We loaded the specialist recommended for your symptoms. Please select a timeslot below.', 'success');
  };

  // Main UI router helper
  const renderWorkspaceTab = () => {
    if (!user) return null;
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            user={user}
            doctors={doctors}
            patients={patients}
            appointments={appointments}
            queue={queue}
            setActiveTab={setActiveTab}
            onCallNextPatient={onCallNextPatient}
            onSkipPatient={onSkipPatient}
            showToast={showToast}
          />
        );
      case 'records':
        return (
          <MedicalRecords 
            user={user}
            patients={patients}
            doctors={doctors}
            records={records}
            onCreateRecord={onCreateRecord}
            onUpdateRecord={onUpdateRecord}
            onDeleteRecord={onDeleteRecord}
            showToast={showToast}
          />
        );
      case 'doctors':
        return (
          <Doctors 
            user={user}
            doctors={doctors}
            onAddDoctor={onAddDoctor}
            onUpdateDoctor={onUpdateDoctor}
            onDeleteDoctor={onDeleteDoctor}
            showToast={showToast}
          />
        );
      case 'appointments':
        return (
          <Appointments 
            user={user}
            doctors={doctors}
            patients={patients}
            appointments={appointments}
            onBookAppointment={onBookAppointment}
            onUpdateAppointment={onUpdateAppointment}
            showToast={showToast}
          />
        );
      case 'queue':
        return (
          <Queue 
            user={user}
            doctors={doctors}
            queue={queue}
            onCallNextPatient={onCallNextPatient}
            onSkipPatient={onSkipPatient}
            onGenerateWalkInToken={onGenerateWalkInToken}
            showToast={showToast}
          />
        );
      case 'symptoms':
        return (
          <AISymptomChecker 
            doctors={doctors}
            onBookDirect={handleSymptomBookRedirect}
            showToast={showToast}
          />
        );
      case 'summarizer':
        return (
          <AIReportSummarizer 
            showToast={showToast}
          />
        );
      case 'chatbot':
        return (
          <AIAssistant 
            doctors={doctors}
            showToast={showToast}
          />
        );
      default:
        return <div>Tab not found</div>;
    }
  };

  if (!user) {
    return (
      <>
        <Auth onAuthSuccess={handleAuthSuccess} showToast={showToast} />
        {/* Float toasts */}
        <div id="auth-toasts" className="fixed top-5 right-5 space-y-3 z-50 pointer-events-none max-w-sm w-full">
          {toasts.map(t => (
            <div
              key={t.id}
              className={`p-4 rounded-xl shadow-lg border text-xs flex items-start gap-3 pointer-events-auto transition-all bg-white dark:bg-slate-900 ${
                t.type === 'error' 
                  ? 'border-red-500/20 text-red-600 dark:text-red-400' 
                  : 'border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {t.type === 'error' ? <AlertCircle className="h-5 w-5 shrink-0" /> : <CheckCircle className="h-5 w-5 shrink-0" />}
              <div className="flex-1 min-w-0 font-medium">{t.message}</div>
              <button onClick={() => removeToast(t.id)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white shrink-0">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-300">
      
      {/* SaaS Sidebar */}
      <Sidebar 
        user={user} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onLogout={handleLogout} 
      />

      {/* Main Container */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <div className="max-w-7xl w-full mx-auto p-8 space-y-6">
          {renderWorkspaceTab()}
        </div>
      </main>

      {/* Toasts alerting layer */}
      <div id="global-toasts" className="fixed top-5 right-5 space-y-3 z-50 pointer-events-none max-w-sm w-full">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`p-4 rounded-xl shadow-xl border text-xs flex items-start gap-3 pointer-events-auto transition-all bg-white dark:bg-slate-900 ${
              t.type === 'error' 
                ? 'border-red-500/25 text-red-600 dark:text-red-400' 
                : 'border-emerald-500/25 text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {t.type === 'error' ? <AlertCircle className="h-5 w-5 shrink-0 animate-bounce" /> : <CheckCircle className="h-5 w-5 shrink-0" />}
            <div className="flex-1 min-w-0 font-medium">{t.message}</div>
            <button onClick={() => removeToast(t.id)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white shrink-0">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}

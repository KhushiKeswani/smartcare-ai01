export type UserRole = 'admin' | 'doctor' | 'patient';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  profileId?: string; // Links to Doctor or Patient profile ID
}

export interface WeeklyScheduleItem {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  start: string; // e.g., "09:00"
  end: string;   // e.g., "17:00"
  active: boolean;
}

export interface Doctor {
  id: string;
  name: string;
  email: string;
  department: string;
  specialization: string;
  experience: number; // in years
  consultationFee: number;
  licenseNumber: string;
  weeklySchedule: WeeklyScheduleItem[];
  profileImage?: string;
  bio?: string;
  rating?: number;
  queueLength?: number;
  estimatedWaitPerPatient?: number; // average consultation time, e.g. 15 mins
}

export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  medicalHistory: string;
}

export interface Appointment {
  id: string;
  doctorId: string;
  patientId: string;
  doctorName: string;
  patientName: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // e.g. "09:30"
  status: 'booked' | 'cancelled' | 'completed' | 'rescheduled';
  tokenNumber?: number;
}

export interface QueueItem {
  tokenNumber: number;
  appointmentId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  status: 'waiting' | 'in-consultation' | 'completed' | 'skipped';
  estimatedWaitTime: number; // in minutes
  calledAt?: string; // ISO string
}

export interface SymptomCheckResult {
  department: string;
  urgency: 'low' | 'medium' | 'high';
  recommendationText: string;
  recommendedDoctorIds: string[];
}

export interface AIReportSummary {
  summary: string;
  diagnosis: string;
  medicines: {
    name: string;
    dosage: string;
    duration: string;
  }[];
  recommendations: string[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  department: string;
  diagnosis: string;
  treatment: string;
  symptoms: string;
  vitals?: {
    bloodPressure?: string;
    heartRate?: string;
    temperature?: string;
    weight?: string;
  };
  notes?: string;
}

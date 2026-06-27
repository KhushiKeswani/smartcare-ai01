import React, { useState } from 'react';
import { Activity, ShieldCheck, Mail, Lock, User as UserIcon, Heart, FileCheck, Stethoscope, Award, Clipboard } from 'lucide-react';
import { User } from '../types';

interface AuthProps {
  onAuthSuccess: (token: string, user: User) => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

export default function Auth({ onAuthSuccess, showToast }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<'patient' | 'doctor' | 'admin'>('patient');
  const [loading, setLoading] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  // Doctor Registration attributes
  const [department, setDepartment] = useState('General Medicine');
  const [specialization, setSpecialization] = useState('');
  const [experience, setExperience] = useState('5');
  const [consultationFee, setConsultationFee] = useState('80');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [bio, setBio] = useState('');

  // Patient Registration attributes
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('30');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [medicalHistory, setMedicalHistory] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please fill out all required fields', 'error');
      return;
    }

    if (!isLogin && !name) {
      showToast('Please enter your full name', 'error');
      return;
    }

    setLoading(true);
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

    const payload: any = {
      email,
      password,
    };

    if (!isLogin) {
      payload.name = name;
      payload.role = role;
      if (role === 'doctor') {
        payload.details = {
          department,
          specialization,
          experience: Number(experience),
          consultationFee: Number(consultationFee),
          licenseNumber,
          bio,
        };
      } else if (role === 'patient') {
        payload.details = {
          phone,
          age: Number(age),
          gender,
          medicalHistory,
        };
      }
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      showToast(isLogin ? `Welcome back, ${data.user.name}!` : 'Account created successfully!', 'success');
      onAuthSuccess(data.token, data.user);
    } catch (err: any) {
      showToast(err.message || 'An error occurred during authentication', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-12 transition-colors duration-300">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-150 dark:border-slate-800 overflow-hidden flex flex-col md:flex-row">
        {/* Decorative Sidebar / Feature Side */}
        <div className="md:w-5/12 bg-emerald-600 p-8 text-white flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Activity className="h-8 w-8 text-white animate-pulse" />
              <span className="font-sans font-bold text-xl tracking-tight">SmartCare AI</span>
            </div>
            <p className="text-emerald-100 text-xs font-light leading-relaxed">
              Experience clinical scheduling and next-generation AI healthcare utilities in a single elegant platform.
            </p>
          </div>

          <div className="space-y-4 mt-8 md:mt-0">
            <div className="flex gap-3 items-start">
              <Heart className="h-5 w-5 text-emerald-300 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold">Doctor Management</h4>
                <p className="text-[10px] text-emerald-100 font-light">Custom profiles, schedules, & clinical consultation control.</p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <ShieldCheck className="h-5 w-5 text-emerald-300 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold">AI Symptom Checkers</h4>
                <p className="text-[10px] text-emerald-100 font-light">Get instant clinical routing, urgency ratings, and diagnostics.</p>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-emerald-200/60 font-mono mt-8 md:mt-0">
            v1.0.0 Stable MVP Build
          </div>
        </div>

        {/* Auth Forms */}
        <div className="md:w-7/12 p-8 flex flex-col justify-center">
          <div className="mb-6 text-center md:text-left">
            <h2 className="font-sans font-bold text-2xl text-slate-800 dark:text-white">
              {isLogin ? 'Welcome Back' : 'Join SmartCare AI'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {isLogin ? 'Sign in to access your clinical dashboard' : 'Create an account to start managing your health journey'}
            </p>
          </div>

          {/* Toggle Role (Registration Only) */}
          {!isLogin && (
            <div className="mb-5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl flex">
              {(['patient', 'doctor', 'admin'] as const).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`flex-1 text-center py-2 text-xs font-medium capitalize rounded-lg transition-all ${
                    role === r
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name (Registration Only) */}
            {!isLogin && (
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Dr. Alexander Fleming / Jane Doe"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="yourname@domain.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                />
              </div>
            </div>

            {/* Role-Specific Fields (Registration Only) */}
            {!isLogin && role === 'doctor' && (
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3.5">
                <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Stethoscope className="h-4 w-4 text-emerald-500" />
                  Clinician Registration Attributes
                </h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-medium text-slate-500 mb-1">Department</label>
                    <select
                      value={department}
                      onChange={e => setDepartment(e.target.value)}
                      className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
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
                    <label className="block text-[10px] font-medium text-slate-500 mb-1">Specialization</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Heart Failure"
                      value={specialization}
                      onChange={e => setSpecialization(e.target.value)}
                      className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-slate-500 mb-1">Exp. (Years)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={experience}
                      onChange={e => setExperience(e.target.value)}
                      className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-slate-500 mb-1">Consultation Fee ($)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={consultationFee}
                      onChange={e => setConsultationFee(e.target.value)}
                      className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-slate-500 mb-1">License Number / Registration ID</label>
                  <div className="relative">
                    <Award className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. MD-123456"
                      value={licenseNumber}
                      onChange={e => setLicenseNumber(e.target.value)}
                      className="w-full pl-8 pr-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-slate-500 mb-1">Clinician Bio</label>
                  <textarea
                    placeholder="Short summary of medical background..."
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    rows={2}
                    className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white focus:outline-none"
                  />
                </div>
              </div>
            )}

            {!isLogin && role === 'patient' && (
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
                <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Clipboard className="h-4 w-4 text-emerald-500" />
                  Patient Demographics & Background
                </h4>

                <div className="grid grid-cols-3 gap-2.5">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-medium text-slate-500 mb-1">Contact Phone</label>
                    <input
                      type="text"
                      required
                      placeholder="+1 (555) 000-0000"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-slate-500 mb-1">Age</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="125"
                      value={age}
                      onChange={e => setAge(e.target.value)}
                      className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-slate-500 mb-1">Gender</label>
                  <div className="flex gap-4">
                    {(['Male', 'Female', 'Other'] as const).map(g => (
                      <label key={g} className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                        <input
                          type="radio"
                          name="gender"
                          checked={gender === g}
                          onChange={() => setGender(g)}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        {g}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-slate-500 mb-1">Known Allergies / Medical History</label>
                  <textarea
                    placeholder="Please specify any chronic diseases, heart conditions, allergy notes..."
                    value={medicalHistory}
                    onChange={e => setMedicalHistory(e.target.value)}
                    rows={2}
                    className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 px-4 rounded-xl text-sm transition-all shadow-md shadow-emerald-600/10 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Processing authentications...' : (isLogin ? 'Log In' : 'Complete Registration')}
            </button>
          </form>

          {/* Toggle Login/Register */}
          <div className="mt-5 text-center text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              {isLogin ? "Don't have an account yet? " : "Already have an account? "}
            </span>
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
            >
              {isLogin ? 'Register Here' : 'Login Instead'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

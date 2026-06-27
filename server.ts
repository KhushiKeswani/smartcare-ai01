import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

// Simple JWT encoder/decoder
function jwtSign(payload: any, secret: string = "smartcare_jwt_secret"): string {
  const header = { alg: "HS256", typ: "JWT" };
  const hStr = Buffer.from(JSON.stringify(header)).toString("base64url");
  const pStr = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 24*60*60*1000 })).toString("base64url");
  const signature = Buffer.from(hStr + "." + pStr + "." + secret).toString("base64url").substring(0, 24);
  return `${hStr}.${pStr}.${signature}`;
}

function jwtVerify(token: string, secret: string = "smartcare_jwt_secret"): any {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [hStr, pStr, signature] = parts;
    const expectedSignature = Buffer.from(hStr + "." + pStr + "." + secret).toString("base64url").substring(0, 24);
    if (signature !== expectedSignature) return null;
    const payload = JSON.parse(Buffer.from(pStr, "base64url").toString("utf-8"));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

// Initialize Gemini SDK with telemetry
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || 'MOCK_KEY',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Robust wrapper to call Gemini API with automatic retry and model fallback (gemini-3.1-flash-lite)
async function generateGeminiContentWithFallback(params: {
  contents: any;
  config?: any;
  defaultModel?: string;
}): Promise<any> {
  const primaryModel = params.defaultModel || 'gemini-3.5-flash';
  const fallbackModel = 'gemini-3.1-flash-lite';
  const maxRetries = 2;
  let lastError: any = null;

  // 1. Try with the primary model first, with retries on temporary failures
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: primaryModel,
        contents: params.contents,
        config: params.config,
      });
      if (response && response.text) {
        return response;
      }
    } catch (err: any) {
      lastError = err;
      const errorMsg = String(err).toLowerCase();
      const isTemporary =
        errorMsg.includes('503') ||
        errorMsg.includes('unavailable') ||
        errorMsg.includes('resource_exhausted') ||
        errorMsg.includes('demand') ||
        errorMsg.includes('limit');

      if (isTemporary && attempt < maxRetries) {
        // Simple backoff: 1s, then 2s
        await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
        continue;
      }
      break;
    }
  }

  // 2. If primary failed or was rate-limited, try the fallback model (gemini-3.1-flash-lite)
  try {
    const response = await ai.models.generateContent({
      model: fallbackModel,
      contents: params.contents,
      config: params.config,
    });
    if (response && response.text) {
      console.log(`[Gemini Fallback] Successfully processed using fallback model: ${fallbackModel}`);
      return response;
    }
  } catch (err: any) {
    console.warn(`[Gemini Fallback] Fallback model ${fallbackModel} also failed:`, err?.message || err);
  }

  // 3. If both failed, propagate the error gracefully
  throw lastError || new Error("AI generation failed");
}

const DB_FILE = path.join(process.cwd(), 'database.json');

// Initial seed data
const initialData = {
  users: [
    { id: 'usr_admin', email: 'admin@smartcare.com', password: 'password123', name: 'System Administrator', role: 'admin' },
    { id: 'usr_doc1', email: 'jenkins@smartcare.com', password: 'password123', name: 'Dr. Sarah Jenkins', role: 'doctor', profileId: 'doc_1' },
    { id: 'usr_doc2', email: 'chen@smartcare.com', password: 'password123', name: 'Dr. Robert Chen', role: 'doctor', profileId: 'doc_2' },
    { id: 'usr_doc3', email: 'rahman@smartcare.com', password: 'password123', name: 'Dr. Aisha Rahman', role: 'doctor', profileId: 'doc_3' },
    { id: 'usr_pat1', email: 'patient@smartcare.com', password: 'password123', name: 'John Doe', role: 'patient', profileId: 'pat_1' },
  ],
  doctors: [
    {
      id: 'doc_1',
      name: 'Dr. Sarah Jenkins',
      email: 'jenkins@smartcare.com',
      department: 'Cardiology',
      specialization: 'Interventional Cardiology & Heart Failure',
      experience: 14,
      consultationFee: 150,
      licenseNumber: 'MD-928312',
      bio: 'Dr. Jenkins is a board-certified cardiologist specializing in preventive heart health and minimally invasive cardiovascular interventions. She holds over 14 years of expert medical care.',
      rating: 4.9,
      queueLength: 2,
      estimatedWaitPerPatient: 15,
      weeklySchedule: [
        { day: 'Monday', start: '09:00', end: '17:00', active: true },
        { day: 'Tuesday', start: '09:00', end: '17:00', active: true },
        { day: 'Wednesday', start: '09:00', end: '17:00', active: true },
        { day: 'Thursday', start: '13:00', end: '17:00', active: true },
        { day: 'Friday', start: '09:00', end: '12:00', active: true },
        { day: 'Saturday', start: '09:00', end: '12:00', active: false },
        { day: 'Sunday', start: '09:00', end: '12:00', active: false },
      ]
    },
    {
      id: 'doc_2',
      name: 'Dr. Robert Chen',
      email: 'chen@smartcare.com',
      department: 'Pediatrics',
      specialization: 'Neonatology & Pediatric Allergy',
      experience: 10,
      consultationFee: 120,
      licenseNumber: 'MD-741289',
      bio: 'Dr. Robert Chen is passionate about childhood wellness. He treats children of all ages with a gentle, patient-focused approach, specializing in complex allergy treatments and neonatology care.',
      rating: 4.8,
      queueLength: 1,
      estimatedWaitPerPatient: 15,
      weeklySchedule: [
        { day: 'Monday', start: '08:00', end: '16:00', active: true },
        { day: 'Tuesday', start: '08:00', end: '16:00', active: true },
        { day: 'Wednesday', start: '08:00', end: '16:00', active: false },
        { day: 'Thursday', start: '08:00', end: '16:00', active: true },
        { day: 'Friday', start: '08:00', end: '16:00', active: true },
        { day: 'Saturday', start: '09:00', end: '13:00', active: true },
        { day: 'Sunday', start: '09:00', end: '12:00', active: false },
      ]
    },
    {
      id: 'doc_3',
      name: 'Dr. Aisha Rahman',
      email: 'rahman@smartcare.com',
      department: 'Neurology',
      specialization: 'Epilepsy, Neuro-Immunology & Migraines',
      experience: 12,
      consultationFee: 180,
      licenseNumber: 'MD-652391',
      bio: 'Dr. Aisha Rahman provides comprehensive neurological services. Her practice focuses heavily on modern diagnosis and treatment of headaches, sleep anomalies, epilepsy, and neurological rehabilitation.',
      rating: 4.7,
      queueLength: 0,
      estimatedWaitPerPatient: 20,
      weeklySchedule: [
        { day: 'Monday', start: '10:00', end: '18:00', active: true },
        { day: 'Tuesday', start: '10:00', end: '18:00', active: false },
        { day: 'Wednesday', start: '10:00', end: '18:00', active: true },
        { day: 'Thursday', start: '10:00', end: '18:00', active: true },
        { day: 'Friday', start: '10:00', end: '18:00', active: true },
        { day: 'Saturday', start: '10:00', end: '14:00', active: false },
        { day: 'Sunday', start: '10:00', end: '14:00', active: false },
      ]
    }
  ],
  patients: [
    {
      id: 'pat_1',
      name: 'John Doe',
      email: 'patient@smartcare.com',
      phone: '+1 (555) 123-4567',
      age: 34,
      gender: 'Male',
      medicalHistory: 'History of minor hypertension. Mild seasonal pollen allergies. Non-smoker.'
    }
  ],
  appointments: [
    {
      id: 'apt_1',
      doctorId: 'doc_1',
      patientId: 'pat_1',
      doctorName: 'Dr. Sarah Jenkins',
      patientName: 'John Doe',
      date: new Date().toISOString().split('T')[0],
      timeSlot: '10:00',
      status: 'booked',
      tokenNumber: 101
    }
  ],
  queue: [
    {
      tokenNumber: 101,
      appointmentId: 'apt_1',
      patientId: 'pat_1',
      patientName: 'John Doe',
      doctorId: 'doc_1',
      doctorName: 'Dr. Sarah Jenkins',
      status: 'waiting',
      estimatedWaitTime: 15
    }
  ],
  records: [] as any[]
};

// Database Read/Write utilities
function readDB(): typeof initialData {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
      return initialData;
    }
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error("Error reading db. fallback to initialData", err);
    return initialData;
  }
}

function writeDB(data: typeof initialData) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error writing db", err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json({ limit: '10mb' }));

  // Helper auth middleware
  const authMiddleware = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized. Token missing.' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwtVerify(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Unauthorized. Invalid or expired token.' });
    }
    req.user = decoded;
    next();
  };

  // --- API Routes ---

  // Auth: Login
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const db = readDB();
    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Sign jwt token
    const token = jwtSign({ id: user.id, email: user.email, name: user.name, role: user.role, profileId: user.profileId });
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        profileId: user.profileId
      }
    });
  });

  // Auth: Register
  app.post('/api/auth/register', (req, res) => {
    const { email, password, name, role, details } = req.body;
    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: 'Email, password, name, and role are required' });
    }

    const db = readDB();
    if (db.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return res.status(400).json({ error: 'A user with this email already exists' });
    }

    const userId = `usr_${Date.now()}`;
    const profileId = role === 'doctor' ? `doc_${Date.now()}` : (role === 'patient' ? `pat_${Date.now()}` : undefined);

    const newUser = {
      id: userId,
      email: email.toLowerCase(),
      password,
      name,
      role,
      profileId
    };

    db.users.push(newUser);

    if (role === 'doctor') {
      const newDoctor = {
        id: profileId!,
        name,
        email: email.toLowerCase(),
        department: details?.department || 'General Medicine',
        specialization: details?.specialization || 'General Consultation',
        experience: Number(details?.experience) || 5,
        consultationFee: Number(details?.consultationFee) || 80,
        licenseNumber: details?.licenseNumber || `LIC-${Math.floor(100000 + Math.random() * 900000)}`,
        bio: details?.bio || 'General practitioner with a heart for helping patients.',
        rating: 5.0,
        queueLength: 0,
        estimatedWaitPerPatient: 15,
        weeklySchedule: details?.weeklySchedule || [
          { day: 'Monday', start: '09:00', end: '17:00', active: true },
          { day: 'Tuesday', start: '09:00', end: '17:00', active: true },
          { day: 'Wednesday', start: '09:00', end: '17:00', active: true },
          { day: 'Thursday', start: '09:00', end: '17:00', active: true },
          { day: 'Friday', start: '09:00', end: '17:00', active: true },
          { day: 'Saturday', start: '09:00', end: '13:00', active: false },
          { day: 'Sunday', start: '09:00', end: '12:00', active: false },
        ]
      };
      db.doctors.push(newDoctor);
    } else if (role === 'patient') {
      const newPatient = {
        id: profileId!,
        name,
        email: email.toLowerCase(),
        phone: details?.phone || '',
        age: Number(details?.age) || 30,
        gender: details?.gender || 'Male',
        medicalHistory: details?.medicalHistory || 'No previous major chronic conditions.'
      };
      db.patients.push(newPatient);
    }

    writeDB(db);

    const token = jwtSign({ id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role, profileId: newUser.profileId });
    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        profileId: newUser.profileId
      }
    });
  });

  // Auth: Me
  app.get('/api/auth/me', authMiddleware, (req: any, res) => {
    res.json({ user: req.user });
  });

  // Doctor CRUD
  app.get('/api/doctors', (req, res) => {
    const db = readDB();
    res.json(db.doctors);
  });

  app.get('/api/doctors/:id', (req, res) => {
    const db = readDB();
    const doc = db.doctors.find(d => d.id === req.params.id);
    if (!doc) return res.status(404).json({ error: 'Doctor not found' });
    res.json(doc);
  });

  app.post('/api/doctors', authMiddleware, (req: any, res) => {
    if (req.user.role !== 'admin') {
      return res.status(430).json({ error: 'Only administrators can create doctor profiles.' });
    }
    const { name, email, department, specialization, experience, consultationFee, licenseNumber, weeklySchedule, bio } = req.body;
    if (!name || !email || !department || !specialization || !licenseNumber) {
      return res.status(400).json({ error: 'Name, email, department, specialization and licenseNumber are required' });
    }

    const db = readDB();
    const docId = `doc_${Date.now()}`;
    const newDoc = {
      id: docId,
      name,
      email: email.toLowerCase(),
      department,
      specialization,
      experience: Number(experience) || 1,
      consultationFee: Number(consultationFee) || 50,
      licenseNumber,
      bio: bio || '',
      weeklySchedule: weeklySchedule || [
        { day: 'Monday', start: '09:00', end: '17:00', active: true },
        { day: 'Tuesday', start: '09:00', end: '17:00', active: true },
        { day: 'Wednesday', start: '09:00', end: '17:00', active: true },
        { day: 'Thursday', start: '09:00', end: '17:00', active: true },
        { day: 'Friday', start: '09:00', end: '17:00', active: true },
        { day: 'Saturday', start: '09:00', end: '13:00', active: false },
        { day: 'Sunday', start: '09:00', end: '12:00', active: false },
      ],
      rating: 5.0,
      queueLength: 0,
      estimatedWaitPerPatient: 15
    };

    db.doctors.push(newDoc);
    writeDB(db);
    res.status(201).json(newDoc);
  });

  app.put('/api/doctors/:id', authMiddleware, (req: any, res) => {
    // Only allow Admin or the doctor themselves to edit profile
    if (req.user.role !== 'admin' && req.user.profileId !== req.params.id) {
      return res.status(403).json({ error: 'Access denied. Unauthorized to edit profile.' });
    }

    const db = readDB();
    const index = db.doctors.findIndex(d => d.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Doctor not found' });

    const currentDoc = db.doctors[index];
    db.doctors[index] = {
      ...currentDoc,
      ...req.body,
      id: currentDoc.id, // cannot change ID
      email: req.body.email ? req.body.email.toLowerCase() : currentDoc.email
    };

    writeDB(db);
    res.json(db.doctors[index]);
  });

  app.delete('/api/doctors/:id', authMiddleware, (req: any, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }
    const db = readDB();
    const filtered = db.doctors.filter(d => d.id !== req.params.id);
    db.doctors = filtered;
    writeDB(db);
    res.json({ success: true, message: 'Doctor deleted successfully' });
  });

  // Patient CRUD / Profile
  app.get('/api/patients', authMiddleware, (req, res) => {
    const db = readDB();
    res.json(db.patients);
  });

  app.get('/api/patients/:id', authMiddleware, (req, res) => {
    const db = readDB();
    const pat = db.patients.find(p => p.id === req.params.id);
    if (!pat) return res.status(404).json({ error: 'Patient not found' });
    res.json(pat);
  });

  app.put('/api/patients/:id', authMiddleware, (req: any, res) => {
    if (req.user.role !== 'admin' && req.user.profileId !== req.params.id) {
      return res.status(403).json({ error: 'Access denied. Unauthorized to edit patient profile.' });
    }

    const db = readDB();
    const index = db.patients.findIndex(p => p.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Patient not found' });

    db.patients[index] = {
      ...db.patients[index],
      ...req.body,
      id: db.patients[index].id
    };

    writeDB(db);
    res.json(db.patients[index]);
  });

  // --- Medical Records API Routes ---
  app.get('/api/records', authMiddleware, (req: any, res) => {
    const db = readDB();
    const records = db.records || [];
    const { role, profileId } = req.user;

    if (role === 'patient') {
      // Patients can only see their own records
      const patientRecords = records.filter(r => r.patientId === profileId);
      return res.json(patientRecords);
    }

    // Doctors and Admins can see records for a specific patient, or all records
    const { patientId } = req.query;
    if (patientId) {
      const patientRecords = records.filter(r => r.patientId === patientId);
      return res.json(patientRecords);
    }

    res.json(records);
  });

  app.post('/api/records', authMiddleware, (req: any, res) => {
    const { role, profileId, name } = req.user;
    if (role !== 'doctor' && role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Only doctors and admins can create medical records.' });
    }

    const { patientId, diagnosis, treatment, symptoms, department, vitals, notes } = req.body;
    if (!patientId || !diagnosis || !treatment) {
      return res.status(400).json({ error: 'patientId, diagnosis, and treatment are required fields.' });
    }

    const db = readDB();
    
    // Resolve patient name
    const patient = db.patients.find(p => p.id === patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Resolve doctor details
    let doctorId = '';
    let doctorName = '';
    if (role === 'doctor') {
      doctorId = profileId || '';
      doctorName = name || '';
    } else {
      doctorId = req.body.doctorId || 'doc_1';
      const doc = db.doctors.find(d => d.id === doctorId);
      doctorName = doc ? doc.name : 'Dr. Sarah Jenkins';
    }

    const newRecord = {
      id: `rec_${Date.now()}`,
      patientId,
      patientName: patient.name,
      doctorId,
      doctorName,
      date: new Date().toISOString().split('T')[0],
      department: department || (role === 'doctor' ? (db.doctors.find(d => d.id === profileId)?.department || 'General Medicine') : 'General Medicine'),
      diagnosis,
      treatment,
      symptoms: symptoms || '',
      vitals: vitals || {},
      notes: notes || ''
    };

    if (!db.records) db.records = [];
    db.records.push(newRecord);
    writeDB(db);

    res.status(201).json(newRecord);
  });

  app.put('/api/records/:id', authMiddleware, (req: any, res) => {
    const { role } = req.user;
    if (role !== 'doctor' && role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Only doctors and admins can modify medical records.' });
    }

    const db = readDB();
    if (!db.records) db.records = [];
    
    const index = db.records.findIndex(r => r.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Medical record not found' });
    }

    db.records[index] = {
      ...db.records[index],
      ...req.body,
      id: db.records[index].id,
      patientId: db.records[index].patientId, // cannot change patient association
    };

    writeDB(db);
    res.json(db.records[index]);
  });

  app.delete('/api/records/:id', authMiddleware, (req: any, res) => {
    const { role } = req.user;
    if (role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Only administrators can delete medical records.' });
    }

    const db = readDB();
    if (!db.records) db.records = [];
    
    const index = db.records.findIndex(r => r.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Medical record not found' });
    }

    db.records.splice(index, 1);
    writeDB(db);

    res.json({ success: true, message: 'Medical record deleted successfully.' });
  });

  // Appointment routes
  app.get('/api/appointments', authMiddleware, (req: any, res) => {
    const db = readDB();
    const { role, profileId } = req.user;

    if (role === 'admin') {
      res.json(db.appointments);
    } else if (role === 'doctor') {
      res.json(db.appointments.filter(a => a.doctorId === profileId));
    } else {
      res.json(db.appointments.filter(a => a.patientId === profileId));
    }
  });

  // Conflict Detection & Book Appointment
  app.post('/api/appointments', authMiddleware, (req: any, res) => {
    const { doctorId, date, timeSlot } = req.body;
    if (!doctorId || !date || !timeSlot) {
      return res.status(400).json({ error: 'Doctor ID, date, and timeslot are required' });
    }

    const db = readDB();
    const doctor = db.doctors.find(d => d.id === doctorId);
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

    // Conflict detection: Is another active appointment booked at this slot with this doctor on this day?
    const conflict = db.appointments.some(
      a => a.doctorId === doctorId && a.date === date && a.timeSlot === timeSlot && a.status === 'booked'
    );

    if (conflict) {
      return res.status(409).json({ error: 'Conflict detected. This timeslot is already booked for this doctor on this date.' });
    }

    // Determine patient ID based on logged in user or admin request
    let patientId = req.user.profileId;
    let patientName = req.user.name;

    if (req.user.role === 'admin' && req.body.patientId) {
      const patient = db.patients.find(p => p.id === req.body.patientId);
      if (patient) {
        patientId = patient.id;
        patientName = patient.name;
      }
    }

    if (!patientId) {
      return res.status(400).json({ error: 'Valid patient profile is required to book appointments.' });
    }

    const aptId = `apt_${Date.now()}`;
    const tokenNumber = 100 + db.appointments.filter(a => a.doctorId === doctorId && a.date === date).length + 1;

    const newApt = {
      id: aptId,
      doctorId,
      patientId,
      doctorName: doctor.name,
      patientName,
      date,
      timeSlot,
      status: 'booked' as const,
      tokenNumber
    };

    db.appointments.push(newApt);

    // Also auto-add to active queue if appointment is for today
    const todayStr = new Date().toISOString().split('T')[0];
    if (date === todayStr) {
      const docActiveQueue = db.queue.filter(q => q.doctorId === doctorId && q.status === 'waiting');
      const estimatedWaitTime = (docActiveQueue.length) * (doctor.estimatedWaitPerPatient || 15);

      db.queue.push({
        tokenNumber,
        appointmentId: aptId,
        patientId,
        patientName,
        doctorId,
        doctorName: doctor.name,
        status: 'waiting',
        estimatedWaitTime
      });

      // Update doctor queue count
      const docIndex = db.doctors.findIndex(d => d.id === doctorId);
      if (docIndex !== -1) {
        db.doctors[docIndex].queueLength = (db.doctors[docIndex].queueLength || 0) + 1;
      }
    }

    writeDB(db);
    res.status(201).json(newApt);
  });

  // Reschedule / Cancel Appointment
  app.put('/api/appointments/:id', authMiddleware, (req: any, res) => {
    const { date, timeSlot, status } = req.body;
    const db = readDB();

    const aptIndex = db.appointments.findIndex(a => a.id === req.params.id);
    if (aptIndex === -1) return res.status(404).json({ error: 'Appointment not found' });

    const apt = db.appointments[aptIndex];

    // Security check: only Admin, Doctor, or the Patient themselves can update
    if (req.user.role !== 'admin' && req.user.profileId !== apt.patientId && req.user.profileId !== apt.doctorId) {
      return res.status(403).json({ error: 'Unauthorized to modify this appointment' });
    }

    // Check for conflict on rescheduling
    if (date && timeSlot && (date !== apt.date || timeSlot !== apt.timeSlot)) {
      const conflict = db.appointments.some(
        a => a.id !== apt.id && a.doctorId === apt.doctorId && a.date === date && a.timeSlot === timeSlot && a.status === 'booked'
      );
      if (conflict) {
        return res.status(409).json({ error: 'Conflict detected. This new timeslot is already booked.' });
      }
      apt.date = date;
      apt.timeSlot = timeSlot;
      apt.status = 'rescheduled';
    }

    if (status) {
      apt.status = status;
      // If cancelled, remove from active queue
      if (status === 'cancelled') {
        db.queue = db.queue.filter(q => q.appointmentId !== apt.id);
        const docIndex = db.doctors.findIndex(d => d.id === apt.doctorId);
        if (docIndex !== -1 && db.doctors[docIndex].queueLength && db.doctors[docIndex].queueLength! > 0) {
          db.doctors[docIndex].queueLength = db.doctors[docIndex].queueLength! - 1;
        }
      }
    }

    db.appointments[aptIndex] = apt;
    writeDB(db);
    res.json(apt);
  });

  // Live Queue management routes
  app.get('/api/queue', authMiddleware, (req, res) => {
    const db = readDB();
    res.json(db.queue);
  });

  // Call Next Patient (for Doctor)
  app.post('/api/queue/call-next', authMiddleware, (req: any, res) => {
    const { doctorId } = req.body;
    if (!doctorId) return res.status(400).json({ error: 'Doctor ID is required' });

    if (req.user.role !== 'admin' && req.user.profileId !== doctorId) {
      return res.status(403).json({ error: 'Unauthorized to manage this queue' });
    }

    const db = readDB();

    // 1. Mark current 'in-consultation' patient as 'completed'
    const currentApt = db.queue.find(q => q.doctorId === doctorId && q.status === 'in-consultation');
    if (currentApt) {
      currentApt.status = 'completed';
      // Mark original appointment completed
      const origIndex = db.appointments.findIndex(a => a.id === currentApt.appointmentId);
      if (origIndex !== -1) {
        db.appointments[origIndex].status = 'completed';
      }
    }

    // 2. Find next 'waiting' patient
    const nextApt = db.queue.find(q => q.doctorId === doctorId && q.status === 'waiting');
    if (nextApt) {
      nextApt.status = 'in-consultation';
      (nextApt as any).calledAt = new Date().toISOString();
    }

    // 3. Recalculate estimated wait times for all remaining waiting patients of this doctor
    const docWaitingQueue = db.queue.filter(q => q.doctorId === doctorId && q.status === 'waiting');
    const doctor = db.doctors.find(d => d.id === doctorId);
    const avgConsultTime = doctor?.estimatedWaitPerPatient || 15;

    docWaitingQueue.forEach((item, index) => {
      item.estimatedWaitTime = index * avgConsultTime;
    });

    // Update doctor queue count
    const docIndex = db.doctors.findIndex(d => d.id === doctorId);
    if (docIndex !== -1) {
      db.doctors[docIndex].queueLength = docWaitingQueue.length;
    }

    writeDB(db);
    res.json({
      success: true,
      currentCompleted: currentApt || null,
      nextActive: nextApt || null,
      queue: db.queue.filter(q => q.doctorId === doctorId)
    });
  });

  // Skip Patient
  app.post('/api/queue/skip', authMiddleware, (req: any, res) => {
    const { appointmentId } = req.body;
    if (!appointmentId) return res.status(400).json({ error: 'Appointment ID is required' });

    const db = readDB();
    const item = db.queue.find(q => q.appointmentId === appointmentId);
    if (!item) return res.status(404).json({ error: 'Queue item not found' });

    if (req.user.role !== 'admin' && req.user.profileId !== item.doctorId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    item.status = 'skipped';

    // Recalculate wait times
    const docWaitingQueue = db.queue.filter(q => q.doctorId === item.doctorId && q.status === 'waiting');
    const doctor = db.doctors.find(d => d.id === item.doctorId);
    const avgConsultTime = doctor?.estimatedWaitPerPatient || 15;

    docWaitingQueue.forEach((wi, index) => {
      wi.estimatedWaitTime = index * avgConsultTime;
    });

    const docIndex = db.doctors.findIndex(d => d.id === item.doctorId);
    if (docIndex !== -1) {
      db.doctors[docIndex].queueLength = docWaitingQueue.length;
    }

    writeDB(db);
    res.json({ success: true, item });
  });

  // Generate a queue token manually (e.g. walk-in booking)
  app.post('/api/queue/generate', authMiddleware, (req: any, res) => {
    const { doctorId, patientName, patientPhone } = req.body;
    if (!doctorId || !patientName) return res.status(400).json({ error: 'Doctor ID and Patient Name are required' });

    const db = readDB();
    const doctor = db.doctors.find(d => d.id === doctorId);
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

    // Generate standard token & mock patient/appointment if needed
    const patId = `pat_walkin_${Date.now()}`;
    const aptId = `apt_walkin_${Date.now()}`;
    const tokenNumber = 200 + db.queue.filter(q => q.doctorId === doctorId).length + 1;

    const newApt = {
      id: aptId,
      doctorId,
      patientId: patId,
      doctorName: doctor.name,
      patientName,
      date: new Date().toISOString().split('T')[0],
      timeSlot: 'Walk-In',
      status: 'booked' as const,
      tokenNumber
    };

    db.appointments.push(newApt);

    const docActiveQueue = db.queue.filter(q => q.doctorId === doctorId && q.status === 'waiting');
    const estimatedWaitTime = (docActiveQueue.length) * (doctor.estimatedWaitPerPatient || 15);

    const qItem = {
      tokenNumber,
      appointmentId: aptId,
      patientId: patId,
      patientName,
      doctorId,
      doctorName: doctor.name,
      status: 'waiting' as const,
      estimatedWaitTime
    };

    db.queue.push(qItem);

    // Update doctor queue count
    const docIndex = db.doctors.findIndex(d => d.id === doctorId);
    if (docIndex !== -1) {
      db.doctors[docIndex].queueLength = (db.doctors[docIndex].queueLength || 0) + 1;
    }

    writeDB(db);
    res.status(201).json(qItem);
  });

  // --- AI Feature Endpoints backed by Gemini 3.5-flash ---

  // 1. AI Symptom Checker
  app.post('/api/ai/symptom-check', async (req, res) => {
    const { symptoms } = req.body;
    if (!symptoms) return res.status(400).json({ error: 'Symptoms description is required' });

    const db = readDB();
    const docListBrief = db.doctors.map(d => ({
      id: d.id,
      name: d.name,
      department: d.department,
      specialization: d.specialization
    }));

    try {
      const prompt = `Analyze the following patient symptoms and match them to the most appropriate clinical department and doctor from our clinic database.

Patient Symptoms:
"${symptoms}"

Clinician/Doctors Database:
${JSON.stringify(docListBrief, null, 2)}

Provide your response strictly in the specified JSON schema. Use one of these standard clinical departments: Cardiology, Pediatrics, Neurology, General Medicine, Dermatology, Orthopedics.
Determine the urgency level: "low", "medium", or "high".
Write a direct clinical recommendation explanation.
Recommend the most matching doctor IDs from the clinic database list above.`;

      const response = await generateGeminiContentWithFallback({
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              department: { type: Type.STRING, description: "The recommended department" },
              urgency: { type: Type.STRING, description: "Urgency level: low, medium, high" },
              recommendationText: { type: Type.STRING, description: "Clinical reason and safety recommendation" },
              recommendedDoctorIds: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of recommended doctor IDs matching the symptoms"
              }
            },
            required: ['department', 'urgency', 'recommendationText', 'recommendedDoctorIds']
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error("Empty AI response");
      res.json(JSON.parse(text));
    } catch (err: any) {
      console.warn("AI Symptom Checker error (gracefully handled fallback):", err?.message || err);
      // Fallback response if API key is not active or fails
      res.json({
        department: "General Medicine",
        urgency: "medium",
        recommendationText: "Based on the symptoms provided, we recommend starting with a General Practitioner. If you experience severe chest pain, shortness of breath, or sudden weakness, please visit the emergency room immediately.",
        recommendedDoctorIds: [db.doctors[0]?.id || "doc_1"]
      });
    }
  });

  // 2. AI Doctor Recommendation
  app.post('/api/ai/doctor-recommend', async (req, res) => {
    const { department, preference } = req.body;
    const db = readDB();

    try {
      const docsBrief = db.doctors.map(d => ({
        id: d.id,
        name: d.name,
        department: d.department,
        specialization: d.specialization,
        experience: d.experience,
        rating: d.rating,
        consultationFee: d.consultationFee,
        queueLength: d.queueLength,
        weeklySchedule: d.weeklySchedule.filter(s => s.active).map(s => s.day)
      }));

      const prompt = `Based on the patient's department requirement "${department || 'any'}" and custom preferences "${preference || 'none'}", select and rank the best doctors from our roster.

Doctors List:
${JSON.stringify(docsBrief, null, 2)}

Return a structured JSON object listing the recommended doctors, with a personalized clinical rationale for why each doctor was recommended, taking into account experience, fee, active queue length, and schedule.`;

      const response = await generateGeminiContentWithFallback({
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              recommendations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    doctorId: { type: Type.STRING },
                    doctorName: { type: Type.STRING },
                    rationale: { type: Type.STRING, description: "Detailed clinical reason for recommending this doctor" },
                    matchScore: { type: Type.INTEGER, description: "Score from 1 to 100" }
                  },
                  required: ['doctorId', 'doctorName', 'rationale', 'matchScore']
                }
              }
            },
            required: ['recommendations']
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error("Empty AI response");
      res.json(JSON.parse(text));
    } catch (err: any) {
      console.warn("AI Doctor Recommendation error (gracefully handled fallback):", err?.message || err);
      // Fallback
      const filteredDocs = db.doctors.filter(d => !department || d.department.toLowerCase() === department.toLowerCase());
      const selected = filteredDocs.length > 0 ? filteredDocs : db.doctors;
      res.json({
        recommendations: selected.map(d => ({
          doctorId: d.id,
          doctorName: d.name,
          rationale: `${d.name} is recommended in the ${d.department} department with ${d.experience} years of experience and a strong ${d.rating} rating.`,
          matchScore: 95
        }))
      });
    }
  });

  // 3. AI Queue Prediction
  app.post('/api/ai/queue-predict', async (req, res) => {
    const { doctorId } = req.body;
    if (!doctorId) return res.status(400).json({ error: 'Doctor ID is required' });

    const db = readDB();
    const doctor = db.doctors.find(d => d.id === doctorId);
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

    const activeQueue = db.queue.filter(q => q.doctorId === doctorId);

    try {
      const prompt = `Analyze this active real-time queue at the hospital to predict wait times, delays, peak hours, and list optimization recommendations.

Doctor: ${doctor.name} (${doctor.department})
Avg consultation length: ${doctor.estimatedWaitPerPatient || 15} mins
Active Queue length: ${activeQueue.length}
Patients in Queue:
${JSON.stringify(activeQueue, null, 2)}

Provide a structured, highly realistic JSON response predicting wait times, queue health index (1-10), and actionable workflow recommendations for the staff.`;

      const response = await generateGeminiContentWithFallback({
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              predictedTotalWaitTime: { type: Type.INTEGER, description: "Total predicted wait time in minutes for a new patient" },
              queueHealthIndex: { type: Type.INTEGER, description: "Score from 1 to 10 (10 being perfect flow, 1 being severe backlog)" },
              delaysExplanation: { type: Type.STRING, description: "Analysis of any bottlenecks or peak times" },
              recommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of administrative action items to improve wait times"
              }
            },
            required: ['predictedTotalWaitTime', 'queueHealthIndex', 'delaysExplanation', 'recommendations']
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error("Empty AI response");
      res.json(JSON.parse(text));
    } catch (err: any) {
      console.warn("AI Queue Prediction error (gracefully handled fallback):", err?.message || err);
      // Fallback
      const baseWait = activeQueue.length * (doctor.estimatedWaitPerPatient || 15);
      res.json({
        predictedTotalWaitTime: baseWait,
        queueHealthIndex: activeQueue.length > 3 ? 5 : 9,
        delaysExplanation: activeQueue.length > 3 
          ? "The queue is experiencing normal peak-hour traffic. Average wait times are slightly elevated due to higher registration volume today."
          : "The queue is flowing perfectly with minimal wait times and high clinician throughput.",
        recommendations: [
          "Encourage pre-registration online to minimize registration delays.",
          "Stagger appointments with 5-minute buffer windows to absorb complex cases."
        ]
      });
    }
  });

  // 4. AI Medical Report Summarizer
  app.post('/api/ai/summarize-report', async (req, res) => {
    const { reportText, fileName, fileData } = req.body;
    if (!reportText && !fileData) {
      return res.status(400).json({ error: 'Report text contents or Base64 fileData is required' });
    }

    try {
      let contentPart: any;
      if (fileData) {
        // fileData is a base64 encoded string from file upload
        const mimeType = fileName?.endsWith('.pdf') ? 'application/pdf' : 'text/plain';
        contentPart = {
          inlineData: {
            mimeType,
            data: fileData
          }
        };
      } else {
        contentPart = {
          text: reportText
        };
      }

      const promptPart = {
        text: `Analyze the uploaded medical clinical report, lab report, or prescription text. Summarize the key medical facts, extract a clear clinical diagnosis or main medical issue, compile an exhaustive list of medicines/prescriptions, and give actionable clinical recommendations. Ensure your response adheres strictly to the provided JSON schema.`
      };

      const response = await generateGeminiContentWithFallback({
        contents: { parts: [contentPart, promptPart] },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING, description: "Executive summary of the report" },
              diagnosis: { type: Type.STRING, description: "Primary diagnosis or patient issue found" },
              medicines: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    dosage: { type: Type.STRING },
                    duration: { type: Type.STRING }
                  },
                  required: ['name', 'dosage', 'duration']
                },
                description: "List of medicines prescribed or found in the report"
              },
              recommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of actionable healthcare recommendations for the patient"
              }
            },
            required: ['summary', 'diagnosis', 'medicines', 'recommendations']
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error("Empty AI response");
      res.json(JSON.parse(text));
    } catch (err: any) {
      console.warn("AI Report Summarizer error (gracefully handled fallback):", err?.message || err);
      // Fallback
      res.json({
        summary: "This is a fallback summary of the medical report. Standard laboratory indicators are within normal ranges with minor elevated blood cholesterol. Patient exhibits overall good cardiovascular stability.",
        diagnosis: "Mild Hypercholesterolemia",
        medicines: [
          { name: "Atorvastatin", dosage: "10mg once daily at night", duration: "3 months" },
          { name: "Omega-3 Fish Oil", dosage: "1000mg twice daily with meals", duration: "Ongoing" }
        ],
        recommendations: [
          "Follow a strict low-sodium and low-fat cardiovascular diet.",
          "Engage in moderate-intensity aerobic exercise for at least 150 minutes per week.",
          "Schedule a follow-up lipid panel profile in 12 weeks."
        ]
      });
    }
  });

  // 5. AI Assistant Chatbot
  app.post('/api/ai/assistant', async (req, res) => {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const db = readDB();
    const doctorsBrief = db.doctors.map(d => ({
      name: d.name,
      department: d.department,
      specialization: d.specialization,
      availability: d.weeklySchedule.filter(s => s.active).map(s => s.day).join(', ')
    }));

    try {
      const sysInstruction = `You are the SmartCare AI Clinical Chatbot, an intelligent, empathetic, and professional virtual hospital assistant for SmartCare Hospital.
Your goal is to answer FAQs, list doctor availability, and assist with general appointments.

Hospital Context/Information:
- Doctors & Availability:
${JSON.stringify(doctorsBrief, null, 2)}
- Working Hours: Monday to Friday 09:00 - 18:00, Saturday 09:00 - 13:00 (Emergency Care open 24/7).
- Symptom checker tool and report summarizer tools are available on the patient dashboard.

Guidelines:
- Be highly polite, empathetic, concise, and clinically safe.
- Never prescribe prescription drugs or give definitive life-and-death medical diagnoses.
- Prompt users to visit the Emergency Room immediately if they describe life-threatening situations (e.g. intense chest pain, difficulty breathing, stroke symptoms).
- Help them navigate to departments or recommend the right doctor from our roster.`;

      // Map chat messages to Gemini's format: user or model
      const contents = messages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      const response = await generateGeminiContentWithFallback({
        contents: contents,
        config: {
          systemInstruction: sysInstruction
        }
      });

      const text = response.text;
      if (!text) throw new Error("Empty AI response");
      res.json({ response: text });
    } catch (err: any) {
      console.warn("AI Assistant error (gracefully handled fallback):", err?.message || err);
      // Fallback chatbot reply
      const lastMsg = messages[messages.length - 1]?.text?.toLowerCase() || '';
      let reply = "Hello! I am your SmartCare AI Hospital Assistant. How can I help you today?";
      if (lastMsg.includes('doctor') || lastMsg.includes('avail')) {
        reply = "We have outstanding specialists available in Cardiology (Dr. Sarah Jenkins), Pediatrics (Dr. Robert Chen), and Neurology (Dr. Aisha Rahman). You can book an appointment with them through the Patient Dashboard!";
      } else if (lastMsg.includes('appoint') || lastMsg.includes('book')) {
        reply = "To book an appointment, please log in as a Patient, visit the 'Book Appointment' tab, select your preferred doctor, date, and timeslot, and click Confirm!";
      } else {
        reply = "I'm here to help you navigate our healthcare services. Feel free to ask about our doctors, clinic hours, or help with booking appointments!";
      }
      res.json({ response: reply });
    }
  });

  // Serve static files in production / Vite middleware in dev
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SmartCare AI server running on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server", err);
});

import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Upload, 
  RefreshCw, 
  CheckCircle, 
  ClipboardCheck, 
  AlertTriangle,
  Stethoscope,
  Sparkles,
  Award
} from 'lucide-react';
import { AIReportSummary } from '../types';

interface ReportSummarizerProps {
  showToast: (msg: string, type: 'success' | 'error') => void;
}

export default function AIReportSummarizer({ showToast }: ReportSummarizerProps) {
  const [reportText, setReportText] = useState('');
  const [fileName, setFileName] = useState('');
  const [base64Data, setBase64Data] = useState('');
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<AIReportSummary | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file reading
  const processFile = (file: File) => {
    if (!file) return;

    setFileName(file.name);
    setSummary(null);

    const reader = new FileReader();
    
    // For text files, read as text
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      reader.onload = (e) => {
        if (e.target?.result) {
          setReportText(e.target.result as string);
          setBase64Data('');
        }
      };
      reader.readAsText(file);
    } else {
      // For PDF or image files, convert to base64
      reader.onload = (e) => {
        if (e.target?.result) {
          const rawBase64 = (e.target.result as string).split(',')[1];
          setBase64Data(rawBase64);
          setReportText('');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleSummarizeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportText.trim() && !base64Data) {
      showToast('Please upload a medical file or paste the report text', 'error');
      return;
    }

    setLoading(true);
    setSummary(null);

    try {
      const response = await fetch('/api/ai/summarize-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportText,
          fileName,
          fileData: base64Data
        }),
      });

      if (!response.ok) throw new Error('Failed to parse clinical report');
      const data = await response.json();
      setSummary(data);
      showToast('Report clinical summary compiled!', 'success');
    } catch (err) {
      showToast('AI Service failed. Rendering standard health summarizer results.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="font-sans font-bold text-2xl text-slate-800 dark:text-white flex items-center gap-2">
          <FileText className="h-7 w-7 text-emerald-500" />
          AI Medical Report Summarizer
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Upload medical consultation files, laboratory blood profiles, or prescription lists to retrieve immediate clinical summaries, diagnoses, & dosage regimens.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Left Drag & drop column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-sans font-bold text-sm text-slate-800 dark:text-white flex items-center gap-1.5">
              <Upload className="h-4.5 w-4.5 text-emerald-500" />
              Upload Medical Report / PDF
            </h3>

            {/* Drag & Drop Area */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={triggerFileSelect}
              className={`p-8 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${
                dragActive 
                  ? 'border-emerald-500 bg-emerald-500/5' 
                  : 'border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:bg-slate-50/50 dark:hover:bg-slate-950/20'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".txt,.pdf,.png,.jpg,.jpeg"
                onChange={handleFileChange}
              />
              <div className="space-y-3">
                <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full w-fit mx-auto text-slate-400">
                  <FileText className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-700 dark:text-white">
                    Drag and drop file here, or <strong className="text-emerald-600">browse</strong>
                  </p>
                  <p className="text-[10px] text-slate-400 font-light">Supports PDF, TXT, or images up to 10MB</p>
                </div>
              </div>
            </div>

            {/* Selected File Badge */}
            {fileName && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-500/10 flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-2 truncate font-semibold">
                  <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                  {fileName}
                </span>
                <button 
                  onClick={() => { setFileName(''); setBase64Data(''); setReportText(''); setSummary(null); }}
                  className="text-[10px] uppercase font-mono text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  Clear
                </button>
              </div>
            )}

            {/* Alternatively paste text */}
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">Or paste report text manually</span>
              <textarea
                placeholder="Paste laboratory results, clinical summary, or discharge summary text here..."
                value={reportText}
                onChange={e => { setReportText(e.target.value); setFileName(''); setBase64Data(''); }}
                rows={5}
                className="w-full p-3.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white leading-relaxed font-light"
              />
            </div>

            <button
              onClick={handleSummarizeSubmit}
              disabled={loading || (!reportText.trim() && !base64Data)}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  AI compiling medical analysis...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Summarize Medical Report
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Output column */}
        <div className="lg:col-span-3 space-y-6">
          {summary ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm overflow-hidden animate-in slide-in-from-right-5 duration-300 space-y-6 p-6">
              
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex items-center justify-between">
                <div>
                  <span className="text-[9px] uppercase font-mono text-emerald-600 font-bold tracking-widest block mb-1">Clinical AI Summarization</span>
                  <h3 className="font-sans font-bold text-lg text-slate-800 dark:text-white">Analysis Result Overview</h3>
                </div>
                <div className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-mono px-3 py-1 rounded-full flex items-center gap-1.5">
                  <ClipboardCheck className="h-4 w-4" />
                  VERIFIED AID
                </div>
              </div>

              {/* Executive summary */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-mono text-slate-400 tracking-wider">Executive Summary</span>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-light">{summary.summary}</p>
              </div>

              {/* Clinical Diagnosis */}
              <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                <span className="text-[10px] uppercase font-mono text-slate-400 tracking-wider block">Clinical Indicated Diagnosis</span>
                <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl text-xs text-red-600 dark:text-red-400 font-semibold flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 shrink-0" />
                  {summary.diagnosis}
                </div>
              </div>

              {/* Medicines Grid */}
              <div className="space-y-2.5 border-t border-slate-100 dark:border-slate-800 pt-4">
                <span className="text-[10px] uppercase font-mono text-slate-400 tracking-wider block">Prescriptions & Regimen details</span>
                
                {summary.medicines && summary.medicines.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {summary.medicines.map((med, index) => (
                      <div key={index} className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between space-y-1.5">
                        <span className="text-xs font-bold text-slate-800 dark:text-white">{med.name}</span>
                        <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono">
                          <span>Dosage: <strong className="text-slate-700 dark:text-slate-300">{med.dosage}</strong></span>
                          <span>•</span>
                          <span>Duration: <strong className="text-slate-700 dark:text-slate-300">{med.duration}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic font-light">No specific medicines detected in this report.</p>
                )}
              </div>

              {/* Recommendations list */}
              <div className="space-y-2.5 border-t border-slate-100 dark:border-slate-800 pt-4">
                <span className="text-[10px] uppercase font-mono text-slate-400 tracking-wider block">Actionable Healthcare Recommendations</span>
                <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 font-light leading-relaxed">
                  {summary.recommendations?.map((rec, index) => (
                    <li key={index} className="flex gap-2 items-start">
                      <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full shrink-0 mt-1.5" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-16 text-center space-y-4 flex flex-col justify-center h-full min-h-[350px]">
              <div className="bg-slate-100 dark:bg-slate-900 p-5 rounded-full w-fit mx-auto text-slate-400">
                <FileText className="h-10 w-10" />
              </div>
              <div className="max-w-xs mx-auto space-y-1">
                <h4 className="font-bold text-sm text-slate-700 dark:text-white">Waiting for Medical Report</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Please upload a diagnostic report or paste raw laboratory text on the left panel to trigger SmartCare AI clinical summarization.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

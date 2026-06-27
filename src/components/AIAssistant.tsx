import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  Sparkles, 
  RefreshCw, 
  CheckCircle, 
  User, 
  Activity, 
  HelpCircle,
  Clock
} from 'lucide-react';
import { ChatMessage, Doctor } from '../types';

interface AIAssistantProps {
  doctors: Doctor[];
  showToast: (msg: string, type: 'success' | 'error') => void;
}

export default function AIAssistant({ doctors, showToast }: AIAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Hello! I am your SmartCare AI Hospital Assistant. I can help you check doctor availabilities, navigate clinic opening hours, answer scheduling FAQs, and provide general department guidance. How can I assist you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Pre-configured FAQ quick-clicks
  const faqs = [
    "What clinicians are available in Cardiology?",
    "How can I book a consultation slot?",
    "What are the hospital working hours?",
    "Do you offer emergency services?"
  ];

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            sender: m.sender,
            text: m.text
          }))
        })
      });

      if (!response.ok) throw new Error('AI Assistant service offline');
      const data = await response.json();

      setMessages(prev => [...prev, {
        id: `assistant_${Date.now()}`,
        sender: 'assistant',
        text: data.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch (err) {
      showToast('AI Chatbot offline. Using pre-defined clinic FAQ logic.', 'error');
      // Fallback answers
      const lowerText = textToSend.toLowerCase();
      let reply = "I am currently running in safety fallback mode. You can book scheduled consultation slots directly under the 'Appointments' panel.";
      if (lowerText.includes('cardiology') || lowerText.includes('jenkins')) {
        reply = "Dr. Sarah Jenkins is our chief cardiologist. She specializes in Heart Failure and is available Monday through Friday from 09:00 to 17:00. You can review her availability on the Doctors panel!";
      } else if (lowerText.includes('appoint') || lowerText.includes('book')) {
        reply = "To register a booking, log in as a Patient, select 'Appointments', click 'Book New Appointment', verify doctor schedule conflicts, and confirm your preferred slot.";
      } else if (lowerText.includes('hours') || lowerText.includes('working')) {
        reply = "SmartCare Hospital clinics operate Monday to Friday 09:00 - 18:00 and Saturdays 09:00 - 13:00. Urgent emergency services operate 24/7.";
      } else if (lowerText.includes('emergency')) {
        reply = "Yes! Our urgent trauma and critical emergency service units are fully active 24/7 with zero waiting time locks. Please visit the nearest ER unit for acute support.";
      }

      setMessages(prev => [...prev, {
        id: `assistant_${Date.now()}`,
        sender: 'assistant',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputText);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="font-sans font-bold text-2xl text-slate-800 dark:text-white flex items-center gap-2">
          <MessageSquare className="h-7 w-7 text-emerald-500" />
          SmartCare AI Hospital Assistant
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Consult our empathetic virtual clinic assistant to query active doctor duties, opening hours, diagnostic guides, or scheduling assistance.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* Left column FAQ lists */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <HelpCircle className="h-4.5 w-4.5 text-blue-500" />
              Frequently Asked Quick-Clicks
            </h4>
            <div className="space-y-2">
              {faqs.map((faq, index) => (
                <button
                  key={index}
                  onClick={() => handleSendMessage(faq)}
                  className="w-full text-left p-3 bg-slate-50 dark:bg-slate-950 hover:bg-emerald-50/40 dark:hover:bg-slate-800 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800/80 hover:border-emerald-500/20 transition-all leading-normal"
                >
                  {faq}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-sm space-y-3 text-xs leading-normal font-light">
            <p className="font-bold flex items-center gap-1.5 text-emerald-400 font-sans text-xs">
              <Clock className="h-4 w-4" />
              Clinic Quick-Facts
            </p>
            <p className="text-slate-300">
              SmartCare clinics are operational Monday to Friday, 9:00 AM to 6:00 PM. Same-day walk-in tokens are available.
            </p>
          </div>
        </div>

        {/* Right column Chat interface */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-150 dark:border-slate-800 shadow-md overflow-hidden flex flex-col h-[550px]">
            
            {/* Chat header */}
            <div className="p-4.5 border-b border-slate-150 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-950/20">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-500/10 text-emerald-500 p-2 rounded-full border border-emerald-500/15">
                  <Activity className="h-4 w-4 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-sans font-bold text-sm text-slate-800 dark:text-white">SmartCare AI Clinical Bot</h4>
                  <p className="text-[10px] text-emerald-600 font-mono font-bold tracking-wider uppercase">Active AI Assistance</p>
                </div>
              </div>
              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2.5 py-1 rounded-full uppercase tracking-wider font-semibold">Gemini 3.5-flash</span>
            </div>

            {/* Messages container */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/30 dark:bg-slate-950/5">
              {messages.map(m => {
                const isAssistant = m.sender === 'assistant';
                return (
                  <div key={m.id} className={`flex gap-3.5 max-w-[85%] ${isAssistant ? '' : 'ml-auto flex-row-reverse'}`}>
                    {/* Avatar */}
                    <div className={`h-8.5 w-8.5 rounded-full shrink-0 flex items-center justify-center border ${
                      isAssistant 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                        : 'bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                      {isAssistant ? <Sparkles className="h-4.5 w-4.5" /> : <User className="h-4.5 w-4.5" />}
                    </div>

                    {/* Bubble */}
                    <div className="space-y-1">
                      <div className={`p-4 rounded-2xl text-xs leading-relaxed font-light ${
                        isAssistant 
                          ? 'bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-100' 
                          : 'bg-emerald-600 text-white rounded-tr-none'
                      }`}>
                        {m.text}
                      </div>
                      <span className={`text-[9px] text-slate-400 font-mono block ${isAssistant ? '' : 'text-right'}`}>
                        {m.timestamp}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Loader */}
              {loading && (
                <div className="flex gap-3.5 max-w-[80%]">
                  <div className="h-8.5 w-8.5 rounded-full shrink-0 flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                    <Sparkles className="h-4.5 w-4.5 animate-spin" />
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-850 rounded-2xl text-xs text-slate-500 dark:text-slate-400 font-mono italic animate-pulse flex items-center gap-1.5">
                    AI Clinical assistant is writing...
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Message input bar */}
            <form onSubmit={handleFormSubmit} className="p-4 border-t border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-2">
              <input
                type="text"
                required
                disabled={loading}
                placeholder="Ask details about specialists, booking, schedules..."
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                className="flex-1 p-3.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
              />
              <button
                type="submit"
                disabled={loading || !inputText.trim()}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white p-3.5 rounded-xl transition-all shadow-md shrink-0 flex items-center justify-center"
              >
                <Send className="h-4.5 w-4.5" />
              </button>
            </form>

          </div>
        </div>

      </div>
    </div>
  );
}

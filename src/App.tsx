/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  User, 
  Users, 
  FileText, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ClipboardCheck,
  GraduationCap,
  ChevronRight,
  RefreshCcw,
  FileUp
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import * as mammoth from 'mammoth';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Initialize Gemini
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

interface StudentInfo {
  firstName: string;
  lastName: string;
  group: string;
  subject: string;
}

interface EvaluationResult {
  score: string;
  summary: string;
  details: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  error?: string;
}

export default function App() {
  const [student, setStudent] = useState<StudentInfo>({ firstName: '', lastName: '', group: '', subject: '' });
  const [criteria, setCriteria] = useState<string>('1. Mavzuning ochib berilishi\n2. Grammatik xatolar\n3. Manbalardan foydalanish\n4. Kreativ yondashuv');
  const [gradingSystem, setGradingSystem] = useState<string>('5 ballik sistema (1-5)');
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string | { data: string; mimeType: string } | null>(null);
  const [result, setResult] = useState<EvaluationResult>({
    score: '',
    summary: '',
    details: '',
    status: 'idle'
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setResult(prev => ({ ...prev, status: 'idle' }));

    const reader = new FileReader();
    
    if (selectedFile.type === 'application/pdf') {
      // For PDF, we'll send it directly to Gemini if possible, or extract text
      // For simplicity and better results with Gemini 1.5/2.0, we send base64
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        setFileContent({ data: base64, mimeType: 'application/pdf' });
      };
      reader.readAsDataURL(selectedFile);
    } else if (selectedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // For Word, extract text using mammoth
      reader.onload = async () => {
        const arrayBuffer = reader.result as ArrayBuffer;
        try {
          const { value } = await mammoth.extractRawText({ arrayBuffer });
          setFileContent(value);
        } catch (err) {
          console.error("Word extraction error:", err);
          setResult(prev => ({ ...prev, status: 'error', error: "Word faylni o'qishda xatolik yuz berdi." }));
        }
      };
      reader.readAsArrayBuffer(selectedFile);
    } else if (selectedFile.type.startsWith('text/')) {
      reader.onload = () => setFileContent(reader.result as string);
      reader.readAsText(selectedFile);
    } else {
      // Fallback for other formats - try to read as text or just warn
      reader.onload = () => setFileContent(reader.result as string);
      reader.readAsText(selectedFile);
    }
  };

  const evaluateWork = async () => {
    if (!student.firstName || !student.lastName || !student.group || !student.subject || !fileContent) {
      setResult(prev => ({ ...prev, status: 'error', error: "Iltimos, barcha maydonlarni to'ldiring va faylni yuklang." }));
      return;
    }

    setResult({ score: '', summary: '', details: '', status: 'loading' });

    try {
      const model = genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            parts: [
              {
                text: `Siz professional o'qituvchi va baholovchisiz. Quyidagi o'quvchining mustaqil ishini baholang.
                
                Fan: ${student.subject}
                O'quvchi: ${student.firstName} ${student.lastName}
                Guruh: ${student.group}
                
                Baholash sistemasi:
                ${gradingSystem}

                Baholash mezonlari:
                ${criteria}
                
                MUHIM: Natija (ball) har doim butun sonda bo'lishi shart.
                
                Iltimos, quyidagi formatda javob bering (JSON emas, lekin aniq bo'limlar bilan):
                # BAHOLASH NATIJASI
                **Umumiy ball:** [Faqat butun sonni yozing]
                **Xulosa:** [Fanga mos ravishda qisqa va lo'nda xulosa]
                
                # BATAFSIL TAHLIL
                [Har bir mezon bo'yicha fanga xos batafsil fikrlar va tavsiyalar]
                `
              },
              typeof fileContent === 'string' 
                ? { text: `MUSTAQIL ISH MATNI:\n\n${fileContent}` }
                : { inlineData: fileContent }
            ]
          }
        ],
        config: {
          temperature: 0.7,
        }
      });

      const response = await model;
      const text = response.text || "";

      // Simple parsing (could be more robust)
      const scoreMatch = text.match(/\*\*Umumiy ball:\*\*\s*(.*)/);
      const summaryMatch = text.match(/\*\*Xulosa:\*\*\s*(.*)/);
      
      setResult({
        score: scoreMatch ? scoreMatch[1] : 'Baholanmagan',
        summary: summaryMatch ? summaryMatch[1] : 'Xulosa mavjud emas',
        details: text,
        status: 'success'
      });
    } catch (err) {
      console.error("AI Evaluation error:", err);
      setResult(prev => ({ ...prev, status: 'error', error: "Baholash jarayonida xatolik yuz berdi. Qayta urinib ko'ring." }));
    }
  };

  const resetForm = () => {
    setStudent({ firstName: '', lastName: '', group: '', subject: '' });
    setFile(null);
    setFileContent(null);
    setResult({ score: '', summary: '', details: '', status: 'idle' });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <GraduationCap className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">EduAssess AI</h1>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Mustaqil Ishlarni Baholash Tizimi</p>
            </div>
          </div>
          <button 
            onClick={resetForm}
            className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
          >
            <RefreshCcw className="w-4 h-4" />
            <span>Tozalash</span>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Input Form */}
        <section className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <User className="w-5 h-5 text-indigo-600" />
              <h2 className="font-semibold text-slate-800">O'quvchi Ma'lumotlari</h2>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Ism</label>
                  <input 
                    type="text" 
                    placeholder="Masalan: Ali"
                    value={student.firstName}
                    onChange={(e) => setStudent(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Familiya</label>
                  <input 
                    type="text" 
                    placeholder="Masalan: Valiyev"
                    value={student.lastName}
                    onChange={(e) => setStudent(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Fan Nomi</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Masalan: Matematika"
                      value={student.subject}
                      onChange={(e) => setStudent(prev => ({ ...prev, subject: e.target.value }))}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Guruh / Sinf</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Masalan: 301-guruh"
                      value={student.group}
                      onChange={(e) => setStudent(prev => ({ ...prev, group: e.target.value }))}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <ClipboardCheck className="w-5 h-5 text-indigo-600" />
              <h2 className="font-semibold text-slate-800">Baholash Mezonlari va Sistemasi</h2>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Baholash Sistemasi</label>
                <input 
                  type="text" 
                  placeholder="Masalan: 5 ballik sistema, 100 ballik yoki A-F"
                  value={gradingSystem}
                  onChange={(e) => setGradingSystem(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Baholash Mezonlari (har biri yangi qatorda)</label>
                <textarea 
                  rows={4}
                  value={criteria}
                  onChange={(e) => setCriteria(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none font-sans text-sm"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <FileUp className="w-5 h-5 text-indigo-600" />
              <h2 className="font-semibold text-slate-800">Faylni Yuklash</h2>
            </div>

            <div 
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all",
                file ? "border-indigo-500 bg-indigo-50/30" : "border-slate-200 hover:border-indigo-400 hover:bg-slate-50"
              )}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.docx,.txt"
                className="hidden"
              />
              <div className={cn(
                "p-3 rounded-full",
                file ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-400"
              )}>
                <Upload className="w-6 h-6" />
              </div>
              <div className="text-center">
                <p className="font-medium text-slate-700">
                  {file ? file.name : "Faylni tanlang yoki shu yerga tashlang"}
                </p>
                <p className="text-xs text-slate-500 mt-1">PDF, DOCX yoki TXT formatlari</p>
              </div>
              {file && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-100/50 px-2 py-1 rounded-md">
                  <CheckCircle2 className="w-3 h-3" />
                  Tayyor
                </div>
              )}
            </div>

            <button 
              onClick={evaluateWork}
              disabled={result.status === 'loading'}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              {result.status === 'loading' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Baholanmoqda...</span>
                </>
              ) : (
                <>
                  <ChevronRight className="w-5 h-5" />
                  <span>AI Baholashni Boshlash</span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* Right Column: Results */}
        <section className="h-full">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 h-full flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h2 className="font-semibold text-slate-800">Baholash Natijasi</h2>
              </div>
              {result.status === 'success' && (
                <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  TAYYOR
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
              {result.status === 'idle' && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-60">
                  <div className="bg-slate-200 p-4 rounded-full">
                    <ClipboardCheck className="w-10 h-10 text-slate-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-600">Hali baholanmagan</p>
                    <p className="text-sm text-slate-500 max-w-[240px]">Ma'lumotlarni to'ldiring va baholash tugmasini bosing</p>
                  </div>
                </div>
              )}

              {result.status === 'loading' && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                    <GraduationCap className="absolute inset-0 m-auto w-6 h-6 text-indigo-600" />
                  </div>
                  <div className="space-y-2">
                    <p className="font-bold text-slate-800 text-lg">AI tahlil qilmoqda...</p>
                    <div className="flex flex-col gap-1">
                      <p className="text-sm text-slate-500 animate-pulse">Matn o'rganilmoqda</p>
                      <p className="text-sm text-slate-500 animate-pulse delay-75">Mezonlar bo'yicha solishtirilmoqda</p>
                      <p className="text-sm text-slate-500 animate-pulse delay-150">Xulosa tayyorlanmoqda</p>
                    </div>
                  </div>
                </div>
              )}

              {result.status === 'error' && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-6 flex flex-col items-center text-center gap-4">
                  <div className="bg-red-100 p-3 rounded-full">
                    <AlertCircle className="w-8 h-8 text-red-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-red-800">Xatolik yuz berdi</p>
                    <p className="text-sm text-red-600">{result.error}</p>
                  </div>
                  <button 
                    onClick={evaluateWork}
                    className="text-sm font-bold text-red-700 hover:underline"
                  >
                    Qayta urinish
                  </button>
                </div>
              )}

              {result.status === 'success' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* Score Card */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Umumiy Ball</p>
                      <p className="text-3xl font-black text-indigo-600">{result.score}</p>
                    </div>
                    <div className="h-12 w-[1px] bg-slate-100"></div>
                    <div className="space-y-1 flex-1 pl-6">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">O'quvchi</p>
                      <p className="font-bold text-slate-800">{student.firstName} {student.lastName}</p>
                      <p className="text-xs text-slate-500">{student.group}</p>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-100">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 className="w-5 h-5" />
                      <h3 className="font-bold">Qisqa Xulosa</h3>
                    </div>
                    <p className="text-indigo-50 leading-relaxed italic">
                      "{result.summary}"
                    </p>
                  </div>

                  {/* Detailed Markdown */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <div className="markdown-body prose prose-slate max-w-none">
                      <ReactMarkdown>{result.details}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-6 px-6 text-center border-t border-slate-200 bg-white">
        <p className="text-sm text-slate-400">
          &copy; {new Date().getFullYear()} EduAssess AI. Barcha huquqlar himoyalangan.
        </p>
      </footer>
    </div>
  );
}

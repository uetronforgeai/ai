/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cpu, Terminal, Play, Send, Sparkles, RefreshCw, Upload, AlertCircle, CheckCircle, Download, HelpCircle, ChevronRight, MessageSquare } from 'lucide-react';
import { ProjectPrototype } from '../types';

interface PrototypesViewProps {
  projects: ProjectPrototype[];
}

export default function PrototypesView({ projects }: PrototypesViewProps) {
  const [activePlayground, setActivePlayground] = useState<string | null>(null);

  // Urdu Sentiment Analyzer State
  const [urduInput, setUrduInput] = useState('');
  const [urduOutput, setUrduOutput] = useState<{ sentiment: string; scores: { pos: number; neg: number; neu: number }; explanation: string } | null>(null);
  const [isUrduAnalyzing, setIsUrduAnalyzing] = useState(false);

  // CropShield State
  const [cropLeaf, setCropLeaf] = useState<string | null>(null);
  const [cropOutput, setCropOutput] = useState<{ status: string; disease: string; confidence: number; treatment: string; treatmentUrdu: string } | null>(null);
  const [isCropAnalyzing, setIsCropAnalyzing] = useState(false);

  // ForgeBot Chat State
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: "Assalam-o-Alaikum! I am ForgeBot AI, the virtual representative of UETronForge AI. Ask me anything about our research, team members, or project prototypes! How can I assist you today?" }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatSending, setIsChatSending] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Urdu Sentiment Analyzer Logic
  const handleUrduAnalyze = () => {
    if (!urduInput.trim()) return;
    setIsUrduAnalyzing(true);
    setUrduOutput(null);

    // Simulate specialized Urdu NLP analysis
    setTimeout(() => {
      const text = urduInput.toLowerCase();
      let sentiment = 'Neutral';
      let scores = { pos: 35, neg: 25, neu: 40 };
      let explanation = 'The model detected general informative language without strong positive or negative polarity.';

      if (
        text.includes('bohot accha') || text.includes('vadiya') || text.includes('zabar') || 
        text.includes('pasand') || text.includes('shukriya') || text.includes('khushi') || 
        text.includes('alhamdulillah') || text.includes('khoob') || text.includes('shandar')
      ) {
        sentiment = 'Positive';
        scores = { pos: 88, neg: 4, neu: 8 };
        explanation = 'Highly positive sentiment detected. Words of appreciation and satisfaction are evident in the context.';
      } else if (
        text.includes('kharab') || text.includes('bura') || text.includes('bakwas') || 
        text.includes('nafrat') || text.includes('gussa') || text.includes('masla') || 
        text.includes('afsos') || text.includes('bekaar') || text.includes('nahi pasand')
      ) {
        sentiment = 'Negative';
        scores = { pos: 5, neg: 85, neu: 10 };
        explanation = 'Negative sentiment detected. The text expresses frustration, technical problems, or direct complaints.';
      }

      setUrduOutput({ sentiment, scores, explanation });
      setIsUrduAnalyzing(false);
    }, 1200);
  };

  // CropShield Presets
  const leafPresets = [
    {
      id: 'healthy',
      name: 'Healthy Leaf (Sehatmand Gandum)',
      url: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=150&q=80',
      disease: 'Healthy Wheat (Sehatmand)',
      confidence: 99.4,
      treatment: 'No diseases detected. Continue regular irrigation and nitrogen application scheduled for early tillering stages.',
      treatmentUrdu: 'فصل بالکل صحت مند ہے۔ آبپاشی اور نائٹروجن کھاد کا معمول کے مطابق استعمال جاری رکھیں۔'
    },
    {
      id: 'rust',
      name: 'Yellow Stripe Rust (Kungi)',
      url: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&w=150&q=80',
      disease: 'Yellow Stripe Rust (Puccinia striiformis)',
      confidence: 96.8,
      treatment: 'Apply recommended fungicides such as Tebuconazole (250g/acre) or Propiconazole immediately to check rust expansion across fields.',
      treatmentUrdu: 'پیلی کنگی کا حملہ ہے۔ فوری طور پر ٹیبکونازول یا پروپیکونازول (250 گرام فی ایکڑ) کا سپرے کریں۔'
    },
    {
      id: 'mildew',
      name: 'Powdery Mildew (Safaid Ulfi)',
      url: 'https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?auto=format&fit=crop&w=150&q=80',
      disease: 'Powdery Mildew (Erysiphe graminis)',
      confidence: 91.2,
      treatment: 'Improve canopy ventilation, reduce excessive nitrogenous fertilizers temporarily, and spray Hexaconazole (200ml/acre) if rust index exceeds 5%.',
      treatmentUrdu: 'سفید اولفی کا حملہ ہے۔ ہوا کے گزر کو بہتر بنائیں اور ہیکسا کونازول (200 ملی لیٹر فی ایکڑ) سپرے کریں۔'
    }
  ];

  const handleLeafSelect = (preset: typeof leafPresets[0]) => {
    setCropLeaf(preset.url);
    setIsCropAnalyzing(true);
    setCropOutput(null);

    setTimeout(() => {
      setCropOutput({
        status: preset.id === 'healthy' ? 'Healthy' : 'Diseased',
        disease: preset.disease,
        confidence: preset.confidence,
        treatment: preset.treatment,
        treatmentUrdu: preset.treatmentUrdu
      });
      setIsCropAnalyzing(false);
    }, 1500);
  };

  // ForgeBot Chat Logic
  const handleChatSend = async () => {
    if (!chatInput.trim() || isChatSending) return;
    const userMsg = chatInput;
    setChatInput('');
    setChatMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setIsChatSending(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          history: chatMessages.slice(-8) // Send recent context
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setChatMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        setChatMessages((prev) => [...prev, { role: 'assistant', content: "Sorry, I encountered an internal server error. Please try again." }]);
      }
    } catch (error) {
      setChatMessages((prev) => [...prev, { role: 'assistant', content: "Network error. Make sure the server dev stack is active!" }]);
    } finally {
      setIsChatSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 space-y-16 pb-24">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center space-x-1.5 rounded-full border border-teal-500/20 bg-teal-500/5 px-4 py-1.5 text-xs font-mono text-teal-400">
          <Cpu className="h-4 w-4" />
          <span>Interactive Showcases</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">AI Project Prototypes</h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base">
          Rather than just listing what we build, we launch real-time sandbox models. Choose a prototype below to load and run its live interactive demo environment.
        </p>
      </div>

      {/* Grid of Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {projects.map((project) => (
          <div
            key={project.id}
            className="rounded-2xl border border-slate-900 bg-slate-950/60 p-6 flex flex-col justify-between transition-all hover:border-slate-800"
          >
            <div className="space-y-4">
              <div className="relative h-48 w-full overflow-hidden rounded-xl border border-slate-900 bg-slate-900">
                <img
                  src={project.imageUrl}
                  alt={project.title}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute top-3 right-3 rounded-full bg-slate-950/90 px-2.5 py-1 text-[10px] font-mono border border-slate-800 text-teal-400">
                  {project.status}
                </span>
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">{project.title}</h3>
                <div className="flex flex-wrap gap-1">
                  {project.techStack.map((tech) => (
                    <span key={tech} className="text-[10px] font-mono text-slate-500">
                      #{tech}
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {project.longDescription || project.description}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-900">
              <button
                onClick={() => setActivePlayground(project.demoType)}
                className="w-full flex items-center justify-center space-x-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-teal-400 text-xs font-semibold py-2.5 transition-colors border border-teal-500/10"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Launch Interactive Prototype</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Sandbox Workspace Container */}
      <AnimatePresence>
        {activePlayground && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="rounded-3xl border border-slate-800 bg-slate-950 p-6 sm:p-8 space-y-6 relative overflow-hidden"
          >
            {/* Ambient glows inside sandbox */}
            <div className="absolute top-0 right-0 h-44 w-44 bg-teal-500/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 h-44 w-44 bg-indigo-500/5 rounded-full blur-3xl" />

            <div className="flex items-center justify-between border-b border-slate-900 pb-4">
              <div className="flex items-center space-x-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-teal-500 animate-pulse" />
                <h3 className="text-white font-bold tracking-tight text-sm sm:text-base">
                  Prototype Sandbox: {activePlayground === 'urdu-sentiment' ? 'Urdu Sentiment Analyzer' : activePlayground === 'image-analyzer' ? 'CropShield Vision Leaf Diagnostic' : 'ForgeBot AI Assistant'}
                </h3>
              </div>
              <button
                onClick={() => setActivePlayground(null)}
                className="rounded-lg bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                Close Sandbox
              </button>
            </div>

            {/* Urdu Sentiment Analyzer Sandbox */}
            {activePlayground === 'urdu-sentiment' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                <div className="md:col-span-5 space-y-4">
                  <h4 className="text-sm font-semibold text-white">Enter Social/Review Text</h4>
                  <p className="text-xs text-slate-400">
                    Input text in Roman Urdu or Urdu Nastaliq to analyze emotional polarity.
                  </p>
                  <div className="space-y-2">
                    <textarea
                      value={urduInput}
                      onChange={(e) => setUrduInput(e.target.value)}
                      placeholder="e.g. Bohot shandar service hai, bohot maza aya interface use kr k!"
                      rows={4}
                      className="w-full rounded-xl border border-slate-800 bg-slate-900/30 p-3 text-xs text-white placeholder-slate-600 focus:border-teal-500 focus:outline-none"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setUrduInput('Yar ye prototype kharab chal raha hai, mujhe bilkul pasand nahi aya.')}
                        className="rounded bg-slate-900 border border-slate-800 px-2 py-1 text-[10px] text-slate-400 hover:text-white"
                      >
                        Sample Negative
                      </button>
                      <button
                        onClick={() => setUrduInput('Bohot hi umda aur dilkash project hai! Hamza aur Anas ne zabardast kaam kia.')}
                        className="rounded bg-slate-900 border border-slate-800 px-2 py-1 text-[10px] text-slate-400 hover:text-white"
                      >
                        Sample Positive
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={handleUrduAnalyze}
                    disabled={isUrduAnalyzing}
                    className="w-full flex items-center justify-center space-x-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold py-2.5 text-xs transition-colors disabled:opacity-50"
                  >
                    {isUrduAnalyzing ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span>Running embeddings...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Run Inference</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="md:col-span-7 rounded-2xl border border-slate-900 bg-slate-900/10 p-5 space-y-6">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-slate-500">Classification Results</h4>
                  {urduOutput ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-300">Predicted Sentiment</span>
                        <span className={`rounded-full px-3 py-1 text-xs font-mono border font-bold ${
                          urduOutput.sentiment === 'Positive' ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' : urduOutput.sentiment === 'Negative' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-800'
                        }`}>
                          {urduOutput.sentiment}
                        </span>
                      </div>

                      {/* Score Bars */}
                      <div className="space-y-3">
                        {/* Positive */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">Positive</span>
                            <span className="font-mono text-teal-400">{urduOutput.scores.pos}%</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-900 overflow-hidden">
                            <div className="h-full bg-teal-500 rounded-full transition-all duration-500" style={{ width: `${urduOutput.scores.pos}%` }} />
                          </div>
                        </div>

                        {/* Negative */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">Negative</span>
                            <span className="font-mono text-red-400">{urduOutput.scores.neg}%</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-900 overflow-hidden">
                            <div className="h-full bg-red-500 rounded-full transition-all duration-500" style={{ width: `${urduOutput.scores.neg}%` }} />
                          </div>
                        </div>

                        {/* Neutral */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">Neutral</span>
                            <span className="font-mono text-slate-400">{urduOutput.scores.neu}%</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-900 overflow-hidden">
                            <div className="h-full bg-slate-700 rounded-full transition-all duration-500" style={{ width: `${urduOutput.scores.neu}%` }} />
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-1">
                        <span className="text-[10px] font-mono text-slate-500 uppercase">Attention Mapping Explanation</span>
                        <p className="text-xs text-slate-400 leading-relaxed">{urduOutput.explanation}</p>
                      </div>
                    </div>
                  ) : isUrduAnalyzing ? (
                    <div className="py-12 flex flex-col items-center justify-center space-y-3 text-slate-500">
                      <RefreshCw className="h-8 w-8 animate-spin text-teal-500" />
                      <span className="text-xs font-mono">Tokenizer segmenting Roman Urdu...</span>
                    </div>
                  ) : (
                    <div className="py-16 text-center text-slate-600 text-xs font-mono">
                      Awaiting input text for inference...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CropShield Sandbox */}
            {activePlayground === 'image-analyzer' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                <div className="md:col-span-5 space-y-6">
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-white font-sans">Select Farm Image</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Choose an image of wheat leaves collected from Punjab fields to perform neural classification and symptom segmentation.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {leafPresets.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => handleLeafSelect(preset)}
                        className={`group relative rounded-xl overflow-hidden border transition-all ${
                          cropLeaf === preset.url ? 'border-teal-500 ring-2 ring-teal-500/20' : 'border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="h-20 w-full object-cover transition-transform group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-slate-950/40 group-hover:bg-transparent" />
                        <span className="absolute bottom-1 left-1 right-1 rounded bg-slate-950/90 text-[8px] font-semibold text-slate-300 py-0.5 text-center truncate px-1">
                          {preset.id === 'healthy' ? 'Sehatmand' : preset.id === 'rust' ? 'Yellow Rust' : 'Safaid Ulfi'}
                        </span>
                      </button>
                    ))}
                  </div>

                  {cropLeaf && (
                    <div className="rounded-xl border border-slate-900 bg-slate-950/40 overflow-hidden relative">
                      <img src={cropLeaf} alt="Selected Leaf" className="w-full h-44 object-cover" referrerPolicy="no-referrer" />
                      {isCropAnalyzing && (
                        <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center space-y-2">
                          <RefreshCw className="h-6 w-6 animate-spin text-teal-400" />
                          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Running CNN Segmenter...</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="md:col-span-7 rounded-2xl border border-slate-900 bg-slate-900/10 p-5 space-y-6">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-slate-500">Diagnostic Prescription</h4>
                  {cropOutput ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-300">Status</span>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-mono border font-semibold ${
                          cropOutput.status === 'Healthy' ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          {cropOutput.status}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] font-mono text-slate-500 uppercase">Diagnosed Pathogen</span>
                        <div className="text-sm font-bold text-white flex items-center space-x-1.5">
                          <span>{cropOutput.disease}</span>
                          <span className="rounded bg-slate-900 text-indigo-400 px-1.5 py-0.5 text-[10px] font-mono border border-slate-800">
                            {cropOutput.confidence}% confidence
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <span className="text-[10px] font-mono text-slate-500 uppercase">Treatment Advisories</span>
                        
                        <div className="rounded-xl border border-indigo-500/10 bg-indigo-500/5 p-4 space-y-1">
                          <div className="text-[10px] font-semibold text-indigo-300 uppercase">English Advisory</div>
                          <p className="text-xs text-slate-300 leading-relaxed">{cropOutput.treatment}</p>
                        </div>

                        <div className="rounded-xl border border-teal-500/10 bg-teal-500/5 p-4 space-y-1 text-right">
                          <div className="text-[10px] font-semibold text-teal-300 uppercase">تفصیلی سفارشات (اردو)</div>
                          <p className="text-xs text-teal-200 leading-relaxed font-sans">{cropOutput.treatmentUrdu}</p>
                        </div>
                      </div>
                    </div>
                  ) : isCropAnalyzing ? (
                    <div className="py-12 flex flex-col items-center justify-center space-y-3 text-slate-500">
                      <RefreshCw className="h-8 w-8 animate-spin text-teal-500" />
                      <span className="text-xs font-mono">Resizing matrix & calculating density...</span>
                    </div>
                  ) : (
                    <div className="py-16 text-center text-slate-600 text-xs font-mono">
                      Select any leaf image preset to diagnose wheat plant pathology...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ForgeBot Chat Sandbox */}
            {activePlayground === 'ai-chat' && (
              <div className="space-y-4">
                {/* Chat Container */}
                <div className="h-96 w-full rounded-2xl border border-slate-900 bg-slate-900/10 p-4 overflow-y-auto space-y-4 flex flex-col">
                  {chatMessages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex flex-col max-w-[80%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'self-end bg-gradient-to-r from-teal-500/20 to-indigo-500/20 text-white border border-indigo-500/20'
                          : 'self-start bg-slate-950 text-slate-300 border border-slate-900'
                      }`}
                    >
                      <span className="text-[9px] font-mono text-slate-500 uppercase mb-1">
                        {msg.role === 'user' ? 'YOU' : 'ForgeBot AI'}
                      </span>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  ))}
                  {isChatSending && (
                    <div className="self-start bg-slate-950 text-slate-400 border border-slate-900 rounded-2xl p-3.5 text-xs max-w-[80%] flex items-center space-x-2">
                      <RefreshCw className="h-3.5 w-3.5 animate-spin text-teal-400" />
                      <span className="font-mono">Inference processing...</span>
                    </div>
                  )}
                  <div ref={chatBottomRef} />
                </div>

                {/* Input Bar */}
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
                    placeholder="Ask about papers, models, or student profiles..."
                    className="flex-1 rounded-xl border border-slate-800 bg-slate-900/30 px-4 py-3 text-xs text-white placeholder-slate-600 focus:border-teal-500 focus:outline-none"
                  />
                  <button
                    onClick={handleChatSend}
                    disabled={isChatSending || !chatInput.trim()}
                    className="rounded-xl bg-gradient-to-r from-teal-500 to-indigo-600 px-4 py-3 hover:from-teal-400 hover:to-indigo-500 transition-colors disabled:opacity-50"
                  >
                    <Send className="h-4 w-4 text-white" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

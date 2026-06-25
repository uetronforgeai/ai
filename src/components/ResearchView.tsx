/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Calendar, Award, Copy, Check, Quote, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { ResearchPaper } from '../types';

interface ResearchViewProps {
  research: ResearchPaper[];
}

export default function ResearchView({ research }: ResearchViewProps) {
  const safeResearch = Array.isArray(research) ? research : [];
  const [expandedPaper, setExpandedPaper] = useState<string | null>(null);
  const [citationModal, setCitationModal] = useState<ResearchPaper | null>(null);
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedPaper((prev) => (prev === id ? null : id));
  };

  const getAPA = (paper: ResearchPaper) => {
    const authorsStr = paper.authors.join(', ');
    return `${authorsStr}. (${paper.publishedYear}). ${paper.title}. ${paper.venue}.`;
  };

  const getBibTeX = (paper: ResearchPaper) => {
    const key = paper.id;
    const authorsStr = paper.authors.join(' and ');
    return `@article{uetronforge_${key},\n  title={${paper.title}},\n  author={${authorsStr}},\n  journal={${paper.venue}},\n  year={${paper.publishedYear}}\n}`;
  };

  const getIEEE = (paper: ResearchPaper) => {
    const authorsStr = paper.authors.join(', ');
    return `[1] ${authorsStr}, "${paper.title}," in ${paper.venue}, ${paper.publishedYear}.`;
  };

  const handleCopy = (text: string, format: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8 space-y-16 pb-24">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center space-x-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/5 px-4 py-1.5 text-xs font-mono text-indigo-400">
          <BookOpen className="h-4 w-4" />
          <span>Academic Publications</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Applied AI Research</h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base">
          Our group actively researches and contributes to machine learning advancements, specializing in localization strategies and low-resource mobile model optimization.
        </p>
      </div>

      {/* Publications List */}
      <div className="space-y-6">
        {safeResearch.map((paper) => {
          const isExpanded = expandedPaper === paper.id;
          return (
            <div
              key={paper.id}
              className="rounded-2xl border border-slate-900 bg-slate-950/60 p-6 sm:p-8 space-y-4 hover:border-slate-800 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="space-y-2 max-w-3xl">
                  <h2 className="text-xl font-bold text-white leading-snug">{paper.title}</h2>
                  <div className="text-sm font-medium text-slate-400">
                    {paper.authors.map((author, index) => (
                      <span key={author}>
                        <span className={author.includes('Muhammad') || author.includes('Zainab') || author.includes('Hamza') || author.includes('Ayesha') ? 'text-teal-400 font-semibold' : ''}>
                          {author}
                        </span>
                        {index < paper.authors.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2 shrink-0">
                  <span className="inline-flex items-center space-x-1 rounded-full bg-indigo-500/10 px-2.5 py-1 text-xs font-medium font-mono text-indigo-400 border border-indigo-500/10">
                    <Calendar className="h-3 w-3" />
                    <span>{paper.publishedYear}</span>
                  </span>
                  <span className="inline-flex items-center space-x-1 rounded-full bg-teal-500/10 px-2.5 py-1 text-xs font-medium font-mono text-teal-400 border border-teal-500/10">
                    <Award className="h-3 w-3" />
                    <span>Citations: {paper.citationCount}</span>
                  </span>
                </div>
              </div>

              {/* Venue details */}
              <div className="text-xs font-mono text-slate-500 border-l-2 border-indigo-500 pl-3">
                {paper.venue}
              </div>

              {/* Toggle Abstract */}
              <div className="pt-2">
                <button
                  onClick={() => toggleExpand(paper.id)}
                  className="flex items-center space-x-1.5 text-xs font-semibold text-teal-400 hover:text-teal-300 transition-colors"
                >
                  <span>{isExpanded ? 'Hide Abstract' : 'View Abstract'}</span>
                  {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden mt-3"
                    >
                      <p className="text-sm text-slate-400 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-900">
                        {paper.abstract}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-900">
                <button
                  onClick={() => setCitationModal(paper)}
                  className="flex items-center space-x-1.5 rounded-lg border border-slate-800 bg-slate-900/40 hover:bg-slate-900 hover:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-all"
                >
                  <Quote className="h-3.5 w-3.5 text-teal-400" />
                  <span>Cite Publication</span>
                </button>
                {paper.paperUrl && paper.paperUrl !== '#' && (
                  <a
                    href={paper.paperUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1.5 rounded-lg border border-slate-800 bg-slate-900/40 hover:bg-slate-900 hover:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-all"
                  >
                    <span>Read Full Paper</span>
                    <ExternalLink className="h-3.5 w-3.5 text-indigo-400" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Citation Modal */}
      <AnimatePresence>
        {citationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-950 p-6 space-y-6 relative shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                  <Quote className="h-5 w-5 text-teal-400" />
                  <span>Cite Publication</span>
                </h3>
                <button
                  onClick={() => setCitationModal(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-900 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* APA */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold text-indigo-400">APA Format</span>
                    <button
                      onClick={() => handleCopy(getAPA(citationModal), 'apa')}
                      className="text-xs text-slate-400 hover:text-teal-400 flex items-center space-x-1"
                    >
                      {copiedFormat === 'apa' ? <Check className="h-3 w-3 text-teal-400" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedFormat === 'apa' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="rounded-xl border border-slate-900 bg-slate-900/40 p-3 text-xs text-slate-300 font-sans leading-relaxed select-all">
                    {getAPA(citationModal)}
                  </div>
                </div>

                {/* IEEE */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold text-indigo-400">IEEE Format</span>
                    <button
                      onClick={() => handleCopy(getIEEE(citationModal), 'ieee')}
                      className="text-xs text-slate-400 hover:text-teal-400 flex items-center space-x-1"
                    >
                      {copiedFormat === 'ieee' ? <Check className="h-3 w-3 text-teal-400" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedFormat === 'ieee' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="rounded-xl border border-slate-900 bg-slate-900/40 p-3 text-xs text-slate-300 font-sans leading-relaxed select-all">
                    {getIEEE(citationModal)}
                  </div>
                </div>

                {/* BibTeX */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold text-indigo-400">BibTeX Format</span>
                    <button
                      onClick={() => handleCopy(getBibTeX(citationModal), 'bibtex')}
                      className="text-xs text-slate-400 hover:text-teal-400 flex items-center space-x-1"
                    >
                      {copiedFormat === 'bibtex' ? <Check className="h-3 w-3 text-teal-400" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedFormat === 'bibtex' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="rounded-xl border border-slate-900 bg-slate-900/40 p-3 text-[11px] text-slate-300 font-mono leading-relaxed select-all overflow-x-auto whitespace-pre-wrap">
                    {getBibTeX(citationModal)}
                  </pre>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

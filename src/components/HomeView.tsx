/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Github, Linkedin, Mail, Send, CheckCircle, ArrowRight, BrainCircuit, Code, Cpu, Database } from 'lucide-react';
import { PortfolioData } from '../types';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';

interface HomeViewProps {
  portfolioData: PortfolioData;
}

export default function HomeView({ portfolioData }: HomeViewProps) {
  const { settings, team } = portfolioData;
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    // Generate unique ID for message document
    const messageId = `msg-${Date.now()}`;
    const path = `messages/${messageId}`;

    try {
      // 1. Submit directly to Firestore for live decentralized sync
      const msgRef = doc(collection(db, 'messages'), messageId);
      const messagePayload = {
        id: messageId,
        name: formData.name.trim().slice(0, 100),
        email: formData.email.trim().slice(0, 100),
        subject: formData.subject.trim().slice(0, 200),
        message: formData.message.trim().slice(0, 5000), // Enforce size constraint to guard against Denial of Wallet
        createdAt: new Date().toISOString(),
        read: false,
      };

      try {
        await setDoc(msgRef, messagePayload);
        console.log('Successfully saved inquiry message to Firebase Firestore.');
      } catch (fsErr) {
        // Enforce structural error logging and bubbling as required by skill guidelines
        handleFirestoreError(fsErr, OperationType.CREATE, path);
      }

      // 2. Also submit to local server API for server-side handlers/fallbacks
      try {
        await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      } catch (apiErr) {
        console.warn('Backend API submission failed, but message is saved to Firebase Cloud:', apiErr);
      }

      setSubmitSuccess(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (error: any) {
      console.error('Contact Form error:', error);
      setErrorMsg(error.message || 'An error occurred while sending your message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 sm:pt-24 lg:pt-32">
        {/* Background glow effects */}
        <div className="absolute -top-40 left-1/2 -z-10 h-[600px] w-[1000px] -translate-x-1/2 rounded-full bg-gradient-to-r from-teal-500/10 via-indigo-500/10 to-purple-500/10 blur-3xl" />
        <div className="absolute top-1/2 left-0 -z-10 h-72 w-72 rounded-full bg-teal-500/5 blur-3xl" />
        <div className="absolute right-0 bottom-0 -z-10 h-80 w-80 rounded-full bg-indigo-500/5 blur-3xl" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center space-x-2 rounded-full border border-teal-500/20 bg-teal-500/5 px-4 py-1.5 text-xs font-mono text-teal-400"
          >
            <BrainCircuit className="h-4 w-4 animate-pulse" />
            <span>Introducing UET Lahore's AI Collective</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl"
          >
            <span className="block">{settings.companyName}</span>
            <span className="block mt-2 bg-gradient-to-r from-teal-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent">
              {settings.heroTitle}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto max-w-3xl text-base text-slate-400 sm:text-lg md:text-xl leading-relaxed"
          >
            {settings.heroSubtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap justify-center gap-4 pt-4"
          >
            <a
              href="#about"
              className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:from-teal-400 hover:to-indigo-500 transition-all transform hover:-translate-y-0.5"
            >
              <span>Explore Our Work</span>
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#contact"
              className="flex items-center space-x-2 rounded-xl border border-slate-800 bg-slate-900/50 px-6 py-3 text-sm font-semibold text-slate-300 hover:border-slate-700 hover:bg-slate-900 transition-all"
            >
              <Mail className="h-4 w-4 text-teal-400" />
              <span>Get In Touch</span>
            </a>
          </motion.div>
        </div>
      </section>

      {/* Grid Highlights */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-900 bg-slate-950/60 p-6 space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400">
              <Cpu className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-white">Applied AI</h3>
            <p className="text-sm text-slate-400">Engineering production-ready vision and language processing models.</p>
          </div>
          <div className="rounded-2xl border border-slate-900 bg-slate-950/60 p-6 space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-white">Academic Rigor</h3>
            <p className="text-sm text-slate-400">Grounding prototypes in peer-reviewed machine learning research papers.</p>
          </div>
          <div className="rounded-2xl border border-slate-900 bg-slate-950/60 p-6 space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
              <Code className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-white">Full MLOps</h3>
            <p className="text-sm text-slate-400">Dockerizing, quantizing, and serving high-performance API pipelines.</p>
          </div>
          <div className="rounded-2xl border border-slate-900 bg-slate-950/60 p-6 space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              <Database className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-white">Localization</h3>
            <p className="text-sm text-slate-400">Optimizing AI models specifically for Urdu language and local industry datasets.</p>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="rounded-3xl border border-slate-900 bg-slate-950/40 p-8 sm:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-64 w-64 bg-indigo-500/5 rounded-full blur-3xl -z-10" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 space-y-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-teal-400 font-mono">Our Mission</div>
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">About Our Collective</h2>
              <p className="text-slate-400 leading-relaxed text-sm sm:text-base">
                We believe the future of AI belongs to localized, efficient, and accessible engineering. As top-performing BS AI students at UET Lahore, we founded this collective to forge models that serve Pakistan's agriculture, industry, and multilingual digital landscape.
              </p>
            </div>
            <div className="lg:col-span-7 bg-slate-950 rounded-2xl border border-slate-800 p-6 sm:p-8 space-y-6">
              <h3 className="text-white font-semibold text-lg flex items-center space-x-2">
                <BrainCircuit className="h-5 w-5 text-indigo-400" />
                <span>The Core Vision</span>
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {settings.aboutText}
              </p>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="border border-slate-900 rounded-xl p-4 bg-slate-900/10">
                  <div className="text-2xl font-bold text-teal-400">4</div>
                  <div className="text-xs text-slate-500 mt-1 font-mono">FOUNDING PIONEERS</div>
                </div>
                <div className="border border-slate-900 rounded-xl p-4 bg-slate-900/10">
                  <div className="text-2xl font-bold text-indigo-400">2+</div>
                  <div className="text-xs text-slate-500 mt-1 font-mono">RESEARCH PAPERS</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <div className="text-xs font-semibold uppercase tracking-wider text-teal-400 font-mono">Team Members</div>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">The Foundry Pioneers</h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base">
            Get to know the four core co-founders driving our research, architecture, and technology development pipelines.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {team.map((member) => (
            <div
              key={member.id}
              className="group rounded-2xl border border-slate-900 bg-slate-950/60 p-6 flex flex-col justify-between transition-all duration-300 hover:border-slate-800 hover:bg-slate-950/80 hover:-translate-y-1 relative"
            >
              <div className="space-y-6">
                {/* Avatar Container */}
                <div className="relative h-44 w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
                  <img
                    src={member.avatarUrl}
                    alt={member.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                </div>

                {/* Info */}
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-white group-hover:text-teal-400 transition-colors">
                    {member.name}
                  </h3>
                  <div className="text-xs font-mono font-medium text-indigo-400">
                    {member.role}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed pt-2">
                    {member.bio}
                  </p>
                </div>
              </div>

              {/* Skills and Links */}
              <div className="space-y-4 mt-6 pt-4 border-t border-slate-900">
                <div className="flex flex-wrap gap-1.5">
                  {member.skills.slice(0, 4).map((skill) => (
                    <span
                      key={skill}
                      className="rounded bg-slate-900 border border-slate-800 px-1.5 py-0.5 text-[9px] font-mono text-slate-400"
                    >
                      {skill}
                    </span>
                  ))}
                  {member.skills.length > 4 && (
                    <span className="rounded bg-slate-900 border border-slate-800 px-1.5 py-0.5 text-[9px] font-mono text-slate-500">
                      +{member.skills.length - 4}
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-3 text-slate-500">
                  {member.githubUrl && (
                    <a
                      href={member.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-white transition-colors"
                      aria-label={`${member.name} GitHub`}
                    >
                      <Github className="h-4 w-4" />
                    </a>
                  )}
                  {member.linkedinUrl && (
                    <a
                      href={member.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-white transition-colors"
                      aria-label={`${member.name} LinkedIn`}
                    >
                      <Linkedin className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Form Section */}
      <section id="contact" className="mx-auto max-w-3xl px-4 sm:px-6 scroll-mt-24">
        <div className="rounded-3xl border border-slate-900 bg-slate-950/50 p-8 sm:p-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 h-44 w-44 bg-teal-500/5 rounded-full blur-3xl -z-10" />
          
          <div className="text-center space-y-4 mb-10">
            <div className="text-xs font-semibold uppercase tracking-wider text-teal-400 font-mono">Collaboration</div>
            <h2 className="text-3xl font-bold text-white">Contact & Connect</h2>
            <p className="text-sm text-slate-400">
              Want to collaborate, sponsor research, or test our AI prototypes? Drop us a line and we will reach out shortly.
            </p>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-mono text-slate-400 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Dr. Kamran"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 text-sm text-white placeholder-slate-600 focus:border-teal-500 focus:bg-slate-900 focus:outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-mono text-slate-400 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="e.g. you@example.com"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 text-sm text-white placeholder-slate-600 focus:border-teal-500 focus:bg-slate-900 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-400 uppercase tracking-wider">Subject</label>
              <input
                type="text"
                name="subject"
                required
                value={formData.subject}
                onChange={handleInputChange}
                placeholder="e.g. Research inquiry / Partnership proposal"
                className="w-full rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 text-sm text-white placeholder-slate-600 focus:border-teal-500 focus:bg-slate-900 focus:outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-400 uppercase tracking-wider">Message</label>
              <textarea
                name="message"
                required
                rows={5}
                value={formData.message}
                onChange={handleInputChange}
                placeholder="How can our AI collective collaborate with you?"
                className="w-full rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 text-sm text-white placeholder-slate-600 focus:border-teal-500 focus:bg-slate-900 focus:outline-none transition-all resize-none"
              />
            </div>

            {errorMsg && (
              <div className="rounded-xl border border-red-500/15 bg-red-500/5 p-4 text-xs text-red-400">
                {errorMsg}
              </div>
            )}

            {submitSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center space-x-2 rounded-xl border border-teal-500/20 bg-teal-500/10 p-4 text-sm text-teal-400"
              >
                <CheckCircle className="h-5 w-5 shrink-0" />
                <span>Assalam-o-Alaikum! Your message has been sent successfully. We will email you back shortly!</span>
              </motion.div>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-600 py-3.5 text-sm font-semibold text-white hover:from-teal-400 hover:to-indigo-500 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Sending message...</span>
                ) : (
                  <>
                    <span>Send Message</span>
                    <Send className="h-4 w-4" />
                  </>
                )}
              </button>
            )}
          </form>
        </div>
      </section>
    </div>
  );
}

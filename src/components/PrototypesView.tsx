/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Cpu, Github, ExternalLink } from 'lucide-react';
import { ProjectPrototype } from '../types';

interface PrototypesViewProps {
  projects: ProjectPrototype[];
}

export default function PrototypesView({ projects }: PrototypesViewProps) {
  const safeProjects = Array.isArray(projects) ? projects : [];

  return (
    <div id="projects-view" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 space-y-16 pb-24">
      {/* Header with high visual polish */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center space-x-1.5 rounded-full border border-teal-500/20 bg-teal-500/5 px-4 py-1.5 text-xs font-mono text-teal-400">
          <Cpu className="h-4 w-4" />
          <span>Showcase</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          AI & Deep-Tech Projects
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
          A curate catalog of localized artificial intelligence applications, deep learning architectures, and system implementations crafted by our collective.
        </p>
      </div>

      {/* Grid of Projects */}
      {safeProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {safeProjects.map((project, idx) => (
            <motion.div
              key={project.id || idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="group rounded-2xl border border-slate-900 bg-slate-950/60 p-6 flex flex-col justify-between transition-all hover:border-slate-800 hover:bg-slate-950"
            >
              <div className="space-y-4">
                {/* Project Image Banner */}
                <div className="relative h-48 w-full overflow-hidden rounded-xl border border-slate-900 bg-slate-900/40">
                  {project.imageUrl ? (
                    <img
                      src={project.imageUrl}
                      alt={project.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-900 text-slate-600 font-mono text-xs">
                      No Image Available
                    </div>
                  )}
                </div>

                {/* Project Details */}
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-white group-hover:text-teal-400 transition-colors duration-200">
                    {project.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {project.description}
                  </p>
                </div>
              </div>

              {/* GitHub Link Button */}
              <div className="mt-6 pt-4 border-t border-slate-900">
                {project.githubUrl ? (
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center space-x-2 rounded-xl bg-slate-900 hover:bg-slate-850 hover:text-white text-teal-400 text-xs font-semibold py-2.5 transition-all border border-teal-500/10 hover:border-teal-500/20"
                  >
                    <Github className="h-4 w-4" />
                    <span>View Repository</span>
                    <ExternalLink className="h-3 w-3 opacity-60" />
                  </a>
                ) : (
                  <div className="w-full flex items-center justify-center space-x-2 rounded-xl bg-slate-950 text-slate-600 text-xs font-mono py-2.5 border border-slate-900 select-none">
                    <span>Repository Private</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 rounded-3xl border border-dashed border-slate-900 bg-slate-950/20 max-w-md mx-auto space-y-2">
          <p className="text-slate-400 font-medium text-sm">No Projects Published</p>
          <p className="text-slate-600 text-xs">Sign in to the Admin Dashboard to add and publish deep-tech projects.</p>
        </div>
      )}
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Cpu, Mail, Globe, MapPin, Heart } from 'lucide-react';

interface FooterProps {
  companyName: string;
}

export default function Footer({ companyName }: FooterProps) {
  return (
    <footer className="border-t border-slate-900 bg-slate-950 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Col 1 */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Cpu className="h-5 w-5 text-teal-400" />
              <span className="font-bold text-white text-lg tracking-wider">{companyName}</span>
            </div>
            <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
              We are a collective of BS Artificial Intelligence students from UET Lahore, researching and engineering localized deep tech solutions.
            </p>
          </div>

          {/* Col 2 */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-4">Affiliation & Hub</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-indigo-400" />
                <span>UET Lahore, Main GT Road, Lahore, Pakistan</span>
              </li>
              <li className="flex items-center space-x-2">
                <Globe className="h-4 w-4 text-indigo-400" />
                <span>Department of Computer Science & Engineering</span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-indigo-400" />
                <span>uetronforge.ai@gmail.com</span>
              </li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-4">Pakistan Deep Tech Vision</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Developing models tailored for Roman Urdu text translation, localized crop health analytics, and building a community of world-class AI engineers in Pakistan.
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-900 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs">
          <p className="text-slate-500">
            &copy; {new Date().getFullYear()} {companyName}. All rights reserved.
          </p>
          <p className="mt-2 sm:mt-0 flex items-center text-slate-500">
            <span>Designed & Engineered with</span>
            <Heart className="h-3 w-3 text-red-500 mx-1 fill-red-500" />
            <span>by UET Lahore BS AI Pioneers</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CompanySettings {
  companyName: string;
  heroTitle: string;
  heroSubtitle: string;
  aboutText: string;
  contactEmail: string;
  logoText: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  avatarUrl: string;
  skills: string[];
  githubUrl?: string;
  linkedinUrl?: string;
}

export interface ProjectPrototype {
  id: string;
  title: string;
  description: string;
  longDescription?: string;
  status: 'Completed' | 'In Progress' | 'Prototype';
  techStack: string[];
  demoType: 'urdu-sentiment' | 'image-analyzer' | 'ai-chat' | 'math-solver';
  imageUrl: string;
  githubUrl?: string;
}

export interface ResearchPaper {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  venue: string;
  publishedYear: number;
  paperUrl?: string;
  citationCount: number;
}

export interface PortfolioData {
  settings: CompanySettings;
  team: TeamMember[];
  projects: ProjectPrototype[];
  research: ResearchPaper[];
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
  read: boolean;
}

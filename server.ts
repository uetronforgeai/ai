/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

// Load env variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Token setup
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

function generateToken(payload: object): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifyToken(token: string): any {
  try {
    const [header, body, signature] = token.split('.');
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
    if (signature !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

// Auth middleware
function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required' });
  }
  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  (req as any).user = decoded;
  next();
}

// File Paths
const portfolioPath = path.join(process.cwd(), 'src', 'data', 'portfolio.json');
const messagesPath = path.join(process.cwd(), 'src', 'data', 'messages.json');

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'src', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Read Portfolio API
app.get('/api/portfolio', (req, res) => {
  try {
    if (fs.existsSync(portfolioPath)) {
      const data = fs.readFileSync(portfolioPath, 'utf8');
      return res.json(JSON.parse(data));
    }
    return res.status(404).json({ error: 'Portfolio file not found' });
  } catch (error) {
    return res.status(500).json({ error: 'Error reading portfolio data' });
  }
});

// Update Portfolio API
app.post('/api/portfolio', requireAuth, (req, res) => {
  try {
    const portfolioData = req.body;
    fs.writeFileSync(portfolioPath, JSON.stringify(portfolioData, null, 2), 'utf8');
    return res.json({ success: true, message: 'Portfolio updated successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Error saving portfolio data' });
  }
});

// Admin Login API
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (email === 'uetronforge.ai@gmail.com' && password === 'uet@147149153159') {
    const token = generateToken({ email, exp: Date.now() + 24 * 60 * 60 * 1000 });
    return res.json({ token, email });
  }
  return res.status(401).json({ error: 'Invalid email or password' });
});

// Read Messages API
app.get('/api/messages', requireAuth, (req, res) => {
  try {
    if (fs.existsSync(messagesPath)) {
      const data = fs.readFileSync(messagesPath, 'utf8');
      return res.json(JSON.parse(data));
    }
    return res.json([]);
  } catch (error) {
    return res.status(500).json({ error: 'Error reading messages' });
  }
});

// Submit Message API (Contact Form)
app.post('/api/messages', (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    let messages = [];
    if (fs.existsSync(messagesPath)) {
      messages = JSON.parse(fs.readFileSync(messagesPath, 'utf8'));
    }

    const newMessage = {
      id: `msg-${Date.now()}`,
      name,
      email,
      subject,
      message,
      createdAt: new Date().toISOString(),
      read: false,
    };

    messages.unshift(newMessage);
    fs.writeFileSync(messagesPath, JSON.stringify(messages, null, 2), 'utf8');
    return res.json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Error saving message' });
  }
});

// Mark Message as Read API
app.post('/api/messages/:id/read', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    if (fs.existsSync(messagesPath)) {
      const messages = JSON.parse(fs.readFileSync(messagesPath, 'utf8'));
      const msgIndex = messages.findIndex((m: any) => m.id === id);
      if (msgIndex !== -1) {
        messages[msgIndex].read = true;
        fs.writeFileSync(messagesPath, JSON.stringify(messages, null, 2), 'utf8');
        return res.json({ success: true });
      }
    }
    return res.status(404).json({ error: 'Message not found' });
  } catch (error) {
    return res.status(500).json({ error: 'Error marking message as read' });
  }
});

// Delete Message API
app.delete('/api/messages/:id', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    if (fs.existsSync(messagesPath)) {
      let messages = JSON.parse(fs.readFileSync(messagesPath, 'utf8'));
      messages = messages.filter((m: any) => m.id !== id);
      fs.writeFileSync(messagesPath, JSON.stringify(messages, null, 2), 'utf8');
      return res.json({ success: true });
    }
    return res.status(404).json({ error: 'Message file not found' });
  } catch (error) {
    return res.status(500).json({ error: 'Error deleting message' });
  }
});

// Gemini Assistant Client Instantiation
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Chat with ForgeBot AI API
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const ai = getGeminiClient();
    if (ai) {
      // Custom system instructions about UETronForge AI
      const systemInstruction = `You are "ForgeBot AI", the interactive smart representative of "UETronForge AI".
UETronForge AI is a Pakistani deep-tech AI collective of 4 BS AI students from UET Lahore:
1. Muhammad Anas (AI Research Lead & Co-founder, NLP & Urdu linguistics expert)
2. Zainab Sajid (Full-Stack AI Engineer & Co-founder, expert in MLOps & deployment)
3. Hamza Ali (Computer Vision Specialist & Co-founder, YOLO & precision agriculture vision expert)
4. Ayesha Khan (Lead Data Scientist & Co-founder, tabular data, predictive models, stats expert)

Your purpose is to welcome visitors, describe the collective's research papers, explain active project prototypes (such as Urdu Sentiment Analyzer and CropShield Vision), and answer queries about machine learning, deep learning, and their work. Be extremely professional, helpful, polite, and intelligent. Since you represent a Pakistani academic collective, keep a friendly and inspiring tone, occasionally using polite local greetings like "Assalam-o-Alaikum!". Keep responses clear and relatively concise.`;

      // Format previous chat history to the format needed by @google/genai
      // Structure: contents: [ { role: 'user' | 'model', parts: [ { text: string } ] } ]
      const contents = [];
      
      if (history && Array.isArray(history)) {
        for (const msg of history) {
          contents.push({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
          });
        }
      }

      // Add current message
      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      const reply = response.text || "I am processing your query, but could not get a response. Please try again.";
      return res.json({ reply });
    } else {
      // Clever simulated local response engine if GEMINI_API_KEY is missing
      const text = message.toLowerCase();
      let reply = "Assalam-o-Alaikum! I am ForgeBot, the AI assistant for UETronForge. I am currently running in offline simulation mode, but I would love to tell you about our collective! What would you like to know?";

      if (text.includes('anas') || text.includes('muhammad anas')) {
        reply = "Muhammad Anas is our AI Research Lead. He focuses on Natural Language Processing and Urdu NLP. He co-authored our FIT 2025 research paper on Roman Urdu localization!";
      } else if (text.includes('zainab') || text.includes('sajid')) {
        reply = "Zainab Sajid is our Lead AI Engineer. She excels at React, Express, MLOps, and deploying models onto high-performance edge/web platforms.";
      } else if (text.includes('hamza') || text.includes('ali')) {
        reply = "Hamza Ali is our Computer Vision expert. He leads our 'CropShield Vision' project, utilizing deep vision models (like YOLO) to identify crop leaf diseases in Punjab's wheat fields.";
      } else if (text.includes('ayesha') || text.includes('khan')) {
        reply = "Ayesha Khan is our Lead Data Scientist. She brings solid statistical rigor, dataset curation, and predictive model training to the team.";
      } else if (text.includes('cropshield') || text.includes('wheat') || text.includes('disease') || text.includes('rust')) {
        reply = "CropShield Vision is an AI-powered crop disease identifier tailored for wheat rust. By analyzing pictures of leaves, it helps farmers diagnose yellow/stripe rust and powdery mildew. Try the live prototype on our website's projects tab!";
      } else if (text.includes('urdu') || text.includes('sentiment') || text.includes('social')) {
        reply = "Our Urdu Sentiment Analyzer is a specialized deep NLP model that classifies Roman Urdu and Nastaliq Urdu into Positive, Negative, or Neutral sentiments. You can test it in our Projects section!";
      } else if (text.includes('research') || text.includes('paper') || text.includes('fit') || text.includes('ieee')) {
        reply = "We have published two major research papers: 'Localization of Transformer Architectures for Low-Resource Roman Urdu' (FIT 2025) and 'Real-time Mobile Vision for Early Yellow Rust Identification in Punjab'. View details and citation info in our Research tab!";
      } else if (text.includes('hello') || text.includes('hi') || text.includes('hey') || text.includes('assalam')) {
        reply = "Assalam-o-Alaikum! How can I help you today? Ask me about our team (Anas, Zainab, Hamza, Ayesha), our research papers, or our AI prototypes!";
      } else if (text.includes('contact') || text.includes('email') || text.includes('gmail')) {
        reply = "You can email us directly at uetronforge.ai@gmail.com, or fill out the contact form below, and we will get right back to you!";
      }

      // Add a slight artificial delay for a realistic feel
      await new Promise((resolve) => setTimeout(resolve, 600));
      return res.json({ reply });
    }
  } catch (error: any) {
    console.error('Chat Error:', error);
    return res.status(500).json({ error: error.message || 'An error occurred during chat generation' });
  }
});

// Setup Vite Dev server or production static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`UETronForge Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

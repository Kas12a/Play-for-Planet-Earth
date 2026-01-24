import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { config } from "@shared/config";
import { supabaseAdmin } from "./supabase";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    const supabaseConfigured = !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      supabase: supabaseConfigured ? "connected" : "not configured",
      pilotMode: config.PILOT_MODE,
    });
  });

  // Client config endpoint (public, safe values only)
  app.get("/api/config", (_req, res) => {
    res.json({
      supabaseUrl: process.env.SUPABASE_URL || null,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY || null,
      ...config,
    });
  });

  // Feedback submission endpoint
  app.post("/api/feedback", async (req, res) => {
    try {
      const { type, message, screen, userAgent, userId } = req.body;

      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({ error: 'Message is required' });
      }

      // Store in Supabase if configured
      if (supabaseAdmin) {
        const { error } = await supabaseAdmin.from('feedback').insert({
          user_id: userId || null,
          type: type || 'other',
          message: message.trim(),
          screen: screen || null,
          user_agent: userAgent || null,
          app_version: '1.1.0-pilot',
        });

        if (error) {
          console.error('Feedback storage error:', error.message);
        }
      }

      // Log feedback for now (even if Supabase not configured)
      console.log('📝 Feedback received:', { type, message: message.substring(0, 100), screen });

      res.json({ success: true });
    } catch (error) {
      console.error('Feedback error:', error);
      res.status(500).json({ error: 'Failed to submit feedback' });
    }
  });

  return httpServer;
}

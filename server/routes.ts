import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { handAnalysisSchema, positionStatsSchema, cardSchema, gameContextSchema, insertHandHistorySchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Analyze poker hand endpoint
  app.post("/api/analyze-hand", async (req, res) => {
    try {
      const { cards, context } = req.body;
      
      // Validate input
      const validatedCards = z.array(cardSchema).length(2).parse(cards);
      const validatedContext = gameContextSchema.parse(context);
      
      const analysis = await storage.analyzeHand(validatedCards, validatedContext);
      res.json(analysis);
    } catch (error) {
      res.status(400).json({ message: "Invalid input data", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Get position statistics
  app.get("/api/position-stats/:position", async (req, res) => {
    try {
      const position = req.params.position;
      
      if (!['Early Position', 'Middle Position', 'Late Position', 'Blinds'].includes(position)) {
        return res.status(400).json({ message: "Invalid position category" });
      }
      
      const stats = await storage.getPositionStats(position as any);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get position stats", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Save hand history
  app.post("/api/hand-history", async (req, res) => {
    try {
      const validatedData = insertHandHistorySchema.parse(req.body);
      const savedHistory = await storage.saveHandHistory(validatedData);
      res.json(savedHistory);
    } catch (error) {
      res.status(400).json({ message: "Failed to save hand history", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Get hand history
  app.get("/api/hand-history", async (req, res) => {
    try {
      const userId = req.query.userId ? Number(req.query.userId) : undefined;
      const limit = req.query.limit ? Number(req.query.limit) : 50;
      
      const history = await storage.getHandHistory(userId, limit);
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Failed to get hand history", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Create user
  app.post("/api/users", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(validatedData);
      res.json(user);
    } catch (error) {
      res.status(400).json({ message: "Failed to create user", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Get user by username
  app.get("/api/users/:username", async (req, res) => {
    try {
      const username = req.params.username;
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user", error: error instanceof Error ? error.message : String(error) });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

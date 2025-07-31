import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { handAnalysisSchema, positionStatsSchema, cardSchema, gameContextSchema } from "@shared/schema";
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

  const httpServer = createServer(app);
  return httpServer;
}

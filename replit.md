# Poker Strategy Advisor

## Overview

This is a comprehensive poker strategy advisor that helps players make optimal decisions in Texas Hold'em poker. The application provides real-time hand analysis, position-based strategy recommendations, detailed player action tracking, and persistent hand history storage. Built with a modern React frontend and Express backend with PostgreSQL database, it features an intuitive tabbed interface for analyzing hands and reviewing historical play patterns. The system delivers actionable advice based on poker theory, mathematical analysis, and supports 2-9 player tables with exact betting amounts in big blinds.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: React hooks for local state, TanStack Query for server state and caching
- **UI Framework**: Radix UI components with shadcn/ui design system for consistent, accessible interface
- **Styling**: Tailwind CSS with custom poker-themed color variables and responsive design
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules for modern JavaScript features
- **API Design**: RESTful endpoints for hand analysis and position statistics
- **Data Processing**: In-memory storage with planned database integration
- **Error Handling**: Centralized error middleware with structured error responses

### Core Game Logic
- **Poker Engine**: Custom TypeScript implementation for hand strength evaluation
- **Hand Analysis**: Calculates win rates, playability scores, and strategic recommendations
- **Position Strategy**: Provides position-specific advice (Early/Middle/Late Position, Blinds)
- **Action Context**: Considers previous betting action to refine recommendations

### Data Storage Strategy
- **Database**: PostgreSQL with Drizzle ORM for persistent data storage and type safety
- **Schema**: Comprehensive database schema with users and hand_histories tables
- **Storage Interface**: DatabaseStorage class implementing IStorage for all CRUD operations
- **Migration**: Drizzle-kit for database schema management with `npm run db:push`
- **Demo Data**: Pre-created demo user (ID: 1) for testing and development

### UI/UX Design Decisions
- **Card Selection**: Interactive card picker with rank and suit selection
- **Position Selector**: Visual position categories with stack size controls
- **Real-time Analysis**: Instant feedback as users modify inputs
- **Tabbed Interface**: Hand Analyzer and Hand History sections for organized workflow
- **Hand History Tracking**: Persistent storage and display of analyzed hands with results
- **Dark Theme**: Poker table aesthetic with green accents and dark surfaces
- **Responsive**: Mobile-first design with tablet and desktop optimizations

### Development Environment
- **Hot Reload**: Vite HMR for instant development feedback
- **Type Checking**: Strict TypeScript configuration across client and server
- **Path Aliases**: Clean imports with @ aliases for better code organization
- **Development Tools**: Replit integration with error overlays and debugging support

## External Dependencies

### Frontend Libraries
- **Radix UI**: Comprehensive set of accessible, unstyled UI primitives
- **TanStack Query**: Powerful data synchronization and caching for server state
- **Tailwind CSS**: Utility-first CSS framework with custom poker theme
- **Wouter**: Minimalist router (2KB) for single-page application navigation
- **React Hook Form**: Form validation with Zod resolvers for type-safe forms

### Backend Dependencies
- **Express.js**: Web application framework for Node.js
- **Drizzle ORM**: TypeScript-first ORM with excellent developer experience
- **Zod**: Runtime type validation and schema definition
- **Connect-pg-simple**: PostgreSQL session store for Express sessions

### Database
- **PostgreSQL**: Primary database (via Neon serverless)
- **Connection**: Environment-based DATABASE_URL configuration
- **ORM**: Drizzle with migration support and type-safe queries

### Development Tools
- **Vite**: Build tool with plugins for React and development enhancements
- **TypeScript**: Strict type checking across the entire application
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing with Tailwind and Autoprefixer

### External Services
- **Neon Database**: Serverless PostgreSQL hosting
- **Replit**: Development environment with integrated tooling
- **Environment Variables**: Secure configuration for database connections
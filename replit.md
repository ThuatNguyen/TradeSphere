# ChốngLừaĐảo - Anti-Fraud Web Application

## Overview

ChốngLừaĐảo is a Vietnamese anti-fraud web application designed to protect the community from online scams. The platform allows users to search for fraud information, report scammers, read educational blog posts about fraud tactics, and receive support through an AI chatbot.

## User Preferences

Preferred communication style: Simple, everyday language.
Chat system: Built-in AI chatbox with Vietnamese language support (no external Zalo/Facebook integration).

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: TailwindCSS for utility-first styling with Shadcn/ui components for consistent UI
- **State Management**: TanStack Query for server state management and caching
- **Forms**: React Hook Form with Zod validation for robust form handling
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript for type safety across the stack
- **Data Storage**: PostgreSQL database with Drizzle ORM for type-safe operations
- **Validation**: Zod for consistent data validation across client and server
- **API Design**: RESTful API with clear endpoint structure

### Database Design
The application uses Drizzle ORM with PostgreSQL for persistent data storage. The schema includes:
- **Users**: Basic user management (prepared for future authentication)
- **Reports**: Fraud reports with detailed information about scammers
- **Blog Posts**: Educational content about fraud prevention

## Key Components

### 1. Search Functionality
- **Purpose**: Allow users to search for known scammers by phone number, bank account, or suspicious links
- **Implementation**: Real-time search with table display of results
- **Features**: Click-through to detailed report views, recent reports display on homepage

### 2. Report System
- **Purpose**: Enable users to report suspected fraud cases
- **Implementation**: Comprehensive form with validation, anonymous reporting option
- **Data Collected**: Scammer details, financial information, incident description, evidence upload capability

### 3. Educational Blog
- **Purpose**: Share information about common fraud tactics and prevention methods
- **Implementation**: Blog system with search, tags, and detailed post views
- **Features**: Cover images, reading time estimation, view tracking

### 4. AI Chatbot
- **Purpose**: Provide real-time assistance and support to users
- **Implementation**: Built-in floating chatbox with intelligent Vietnamese responses
- **Features**: Smart keyword detection, quick action buttons, comprehensive fraud prevention advice
- **Responses**: Context-aware replies for OTP scams, investment fraud, banking security, social media safety

## Data Flow

1. **User Input**: Forms collect and validate user data using React Hook Form + Zod
2. **API Communication**: TanStack Query manages API calls with caching and error handling
3. **Server Processing**: Express.js routes handle requests with validation
4. **Data Storage**: Currently in-memory storage, designed for easy database migration
5. **Response Handling**: Consistent error handling and success feedback throughout the application

## External Dependencies

### Core Dependencies
- **UI Components**: Radix UI primitives for accessible, unstyled components
- **Database**: Drizzle ORM for type-safe database operations (configured for PostgreSQL)
- **Validation**: Zod for runtime type checking and validation
- **Date Handling**: date-fns for date manipulation and formatting

### Development Tools
- **Build**: Vite with React plugin for fast development
- **TypeScript**: Full TypeScript support across frontend and backend
- **CSS**: PostCSS with TailwindCSS and Autoprefixer

## Deployment Strategy

### Development
- **Hot Reload**: Vite development server with HMR
- **API Proxy**: Integrated Express server for seamless development experience
- **Error Handling**: Runtime error overlay for debugging

### Production
- **Build Process**: Vite builds optimized frontend assets
- **Server Bundle**: ESBuild bundles Express server for deployment
- **Static Assets**: Frontend served from Express server
- **Environment**: Designed for deployment on Replit or similar platforms

### Database Implementation
The application now uses PostgreSQL as the primary database:
- Drizzle ORM provides type-safe database operations
- Automatic database initialization with sample data on startup
- Database tables created via Drizzle Kit migrations
- Environment variables configured for secure database connections

### Security Considerations
- CORS configuration for cross-origin requests
- Input validation on both client and server
- Prepared for session management and authentication
- Form validation prevents injection attacks

The architecture emphasizes modularity, type safety, and scalability while maintaining simplicity for rapid development and deployment.
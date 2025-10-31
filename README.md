# Integrum Helpdesk System

*An AI-powered enterprise support platform with Jira integration, real-time chat, and intelligent automation*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/royes-projects-6bcfe66f/v0-remix-of-agent-chain-workflow)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/projects/UvhNKFShjip)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Architecture](#architecture)
- [User Guide](#user-guide)
- [API Documentation](#api-documentation)
- [Key Functions](#key-functions)
- [Workflows](#workflows)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

Integrum is an AI-automated enterprise support platform that seamlessly integrates with Jira to provide a streamlined ticket management experience. It features real-time chat communication, intelligent ticket status automation, email monitoring, network performance tracking, and a beautiful user interface built with Next.js 15 and Tailwind CSS v4.

### Key Highlights

- **AI-Automated Support**: Intelligent ticket routing and auto-acknowledgement
- **Enterprise-Grade Performance**: <5-minute automated processing target
- **Real-Time Communication**: Built-in chat with instant status updates
- **Secure Integration**: Email-to-support pipeline with encryption and logging
- **High-Volume Architecture**: Optimized for scale with efficient polling and caching

## ✨ Features

### Core Functionality

- **🎫 Jira Integration**: Full bidirectional sync with Jira for ticket management
  - Single-call ticket fetching (no batch pagination)
  - Configurable ticket limits: 50, 100, 200, 500 & 1000 (master only)
  - Automatic status transitions
  - Comment synchronization
  - Attachment handling
  
- **💬 Real-time Chat**: Built-in messaging system with AI-powered support
  - Instant message delivery
  - File attachment support
  - Automatic status detection
  - Resolved ticket state handling
  - Support/user role differentiation

- **🤖 Intelligent Automation**: 
  - Auto-transition to "In Progress" when messages are sent
  - Auto-transition to "Pending Reply" based on chat activity
  - Automatic ticket creation from email
  - AI-driven classification and priority scoring

- **📧 Email Monitoring**: Gmail integration for automatic ticket acknowledgment
  - Secure email-to-support pipeline
  - Auto-acknowledgement detection
  - Email webhook handling
  - N8N workflow integration

- **📊 Advanced Dashboard**: 
  - Three-column organization: "In Progress", "Pending Reply", "Resolved"
  - Real-time category updates (10-second polling)
  - Visual resolved indicators (green checkmark badges)
  - Master account support for viewing all tickets
  - Ticket limit selector with role-based restrictions

- **🔐 Authentication**: Secure Google OAuth with role-based access
  - Master account privileges
  - Session management
  - Secure token handling

- **🎨 Modern UI**: 
  - Beautiful, responsive interface
  - Dark mode support
  - Custom scrollbar styling
  - Toast notifications with red outline for visibility
  - Animated error buttons with gradient effects
  - Enterprise-focused landing page

### Advanced Features

- **Network Performance Monitoring**: 
  - Real-time internet speed display (Mbps)
  - Connection quality tracking
  - Polling check counter

- **Smart Ticket Detection**:
  - Timestamp-based ticket tracking
  - Prevents duplicate ticket detection
  - Optimized polling (2-second intervals)
  - 1-second initial check delay

- **Toast Notification System**:
  - Top-right corner positioning
  - Manual dismiss (no auto-hide)
  - Red outline for high visibility
  - Success notifications for ticket creation

- **Enhanced Error Handling**:
  - Animated error button with pulse effect
  - Gradient background (red to orange)
  - Hover effects and shadows
  - Clear call-to-action for users

- **Frontend Category Management**: 
  - Independent ticket categorization using Supabase
  - Overrides Jira status when needed
  - Real-time synchronization

- **Master Account Support**: 
  - View all tickets across all users
  - Resolve ticket capability
  - Support mode in chat
  - Higher ticket limit (1000 vs 500)

## 🛠 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: Supabase (PostgreSQL)
- **Authentication**: NextAuth.js with Google OAuth
- **External APIs**: 
  - Jira REST API v3
  - Gmail API
  - N8N Workflow Automation
- **UI Components**: shadcn/ui
- **State Management**: React Hooks + SWR
- **Deployment**: Vercel

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- Jira account with API access
- Supabase project
- Google Cloud project with OAuth credentials
- Vercel account (for deployment)

### Installation

1. **Clone the repository**
   \`\`\`bash
   git clone <repository-url>
   cd integrum-helpdesk
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory (see [Environment Variables](#environment-variables))

4. **Set up the database**
   
   Run the SQL scripts in the `scripts/` folder to create necessary tables:
   \`\`\`bash
   # Execute in Supabase SQL Editor or via CLI
   - create-ticket-categories-table.sql
   \`\`\`

5. **Run the development server**
   \`\`\`bash
   npm run dev
   \`\`\`

6. **Open your browser**
   
   Navigate to `http://localhost:3000`

## 🔑 Environment Variables

### Required Variables

\`\`\`env
# Jira Configuration
JIRA_BASE_URL=https://heyroy23415.atlassian.net
JIRA_EMAIL=heyroy23415@gmail.com
JIRA_API_TOKEN=ATATT3xFfGF02vlIm44Y67LnN5XRGvG14gXq4Ob5BeF0VHQM2fNThWq5yvlOncpzCFlWCebep7XcoJjZ4Ux3keQImb_9QGQwgSWaTCAtrYL2wzYk-3uTrIa2rXGjPd7Tm-EaWNhzjo4tHFg3RWwFAmxRdyixCNbAOnbEo7MWz3dnyvWlTzXqxGs=5A796E28
JIRA_PROJECT_KEY=KST
NEXT_PUBLIC_JIRA_BASE_URL=https://heyroy23415.atlassian.net

# Google OAuth
GOOGLE_CLIENT_ID=106334484807-n6ebmj0si2gubcq0nnbl9grpf4jjt0on.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
NEXTAUTH_SECRET=Uy/AF9/33LFTfdoljaxV90Z/cahwLGhNvuen+tn5wsc=
NEXTAUTH_URL=Uy/AF9/33LFTfdoljaxV90Z/cahwLGhNvuen+tn5wsc=

# Supabase
SUPABASE_URL=https://zvymnfrejzposxwogeic.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://zvymnfrejzposxwogeic.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2eW1uZnJlanpwb3N4d29nZWljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MTk3MzUsImV4cCI6MjA3NjA5NTczNX0.bgXzTxlAPFyDqesz1R6Y5lPBHWvuPczhru1BeVIWnbc
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2eW1uZnJlanpwb3N4d29nZWljIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDUxOTczNSwiZXhwIjoyMDc2MDk1NzM1fQ.l834usUgzS-hLUm-v42SIiw9YFNuGiwhCQHdLY16wYw
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2eW1uZnJlanpwb3N4d29nZWljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MTk3MzUsImV4cCI6MjA3NjA5NTczNX0.bgXzTxlAPFyDqesz1R6Y5lPBHWvuPczhru1BeVIWnbc
SUPABASE_JWT_SECRET=zuibc58CryxkzET2awORpEcI+A//mv6tEKWAXcN1jJ7pP0VOiaywGHqc+BEWzak3Q99bXVWz23/ss1SL+mykaQ==

# PostgreSQL (from Supabase)
POSTGRES_URL=zuibc58CryxkzET2awORpEcI+A//mv6tEKWAXcN1jJ7pP0VOiaywGHqc+BEWzak3Q99bXVWz23/ss1SL+mykaQ==
POSTGRES_PRISMA_URL=postgres://postgres.zvymnfrejzposxwogeic:fcX1EoerodScJX04@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
POSTGRES_URL_NON_POOLING=postgres://postgres.zvymnfrejzposxwogeic:fcX1EoerodScJX04@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require
POSTGRES_USER=postgres
POSTGRES_PASSWORD=fcX1EoerodScJX04
POSTGRES_DATABASE=postgres
POSTGRES_HOST=db.zvymnfrejzposxwogeic.supabase.co

# N8N Workflow Automation
N8N_API_KEY=ATATT3xFfGF0_SXDA6OByZxtkD3pPpO-x0mLQW1puFprUgd9qpFsy9B8ZvSFdYhItM2dkr2GiDL8WYN7nn0n_8JxWgbTuk8CpWY9aVFkGfarYq8XyYapgkO5xeF13zgQA826OgxZRqT0olyETwaQF5Cc73Fsly8U9PgUgUPIMYiLXtZb4NIrzkg=57F96918
N8N_API_URL=https://id.atlassian.com/manage-profile/security/api-tokens

# Master Account
NEXT_PUBLIC_MASTER_EMAIL=heyroy23415@gmail.com
\`\`\`

### Getting API Keys

1. **Jira API Token**: 
   - Go to https://id.atlassian.com/manage-profile/security/api-tokens
   - Click "Create API token"
   - Copy the token

2. **Google OAuth**:
   - Go to https://console.cloud.google.com
   - Create a new project or select existing
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URIs

3. **Supabase**:
   - Create a project at https://supabase.com
   - Go to Project Settings > API
   - Copy the URL and anon key

## 💾 Database Setup

### Supabase Tables

#### 1. `ticket_categories` Table

Stores frontend-specific ticket categorization independent of Jira status.

\`\`\`sql
CREATE TABLE ticket_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_key TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('In Progress', 'Pending Reply', 'Resolved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ticket_categories_ticket_key ON ticket_categories(ticket_key);
\`\`\`

#### 2. `chat_messages` Table

Stores all chat messages between users and support.

\`\`\`sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_key TEXT NOT NULL,
  user_email TEXT NOT NULL,
  message TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'support', 'system')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_ticket_key ON chat_messages(ticket_key);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at DESC);
\`\`\`

#### 3. `pending_tickets` Table

Tracks tickets pending email acknowledgment.

\`\`\`sql
CREATE TABLE pending_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id TEXT NOT NULL UNIQUE,
  user_email TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
\`\`\`

### Running SQL Scripts

Execute the SQL scripts in your Supabase project:

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of each script file from the `scripts/` folder
4. Execute the scripts

## 🏗 Architecture

### Project Structure

\`\`\`
integrum-helpdesk/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── chat-messages/        # Chat messaging API
│   │   ├── jira/                 # Jira integration endpoints
│   │   │   ├── tickets/          # Ticket fetching
│   │   │   └── ticket/[key]/     # Individual ticket operations
│   │   ├── tickets/              # Ticket management
│   │   └── email/                # Email webhook handlers
│   ├── jira-ticket/[key]/        # Individual ticket view
│   ├── ticket-processing/        # Ticket creation flow
│   │   ├── pending/              # Loading/polling page
│   │   └── [ticketId]/           # Success page
│   ├── submit-ticket/            # Email compose page
│   ├── page.tsx                  # Landing page
│   └── globals.css               # Global styles with design tokens
├── components/                   # React Components
│   ├── ticket-chatbot.tsx        # Chat interface component
│   ├── ui/                       # shadcn/ui components
│   │   ├── toast.tsx             # Toast notification system
│   │   ├── toaster.tsx           # Toast container
│   │   └── ...
│   └── ...
├── lib/                          # Utility Libraries
│   ├── jira-api.ts               # Jira API client
│   ├── jira-comments.ts          # Jira comments handler
│   ├── gmail-monitor.ts          # Gmail monitoring logic
│   ├── auth-utils.ts             # Authentication utilities
│   └── types.ts                  # TypeScript type definitions
├── scripts/                      # Database scripts
│   └── create-ticket-categories-table.sql
└── README.md                     # This file
\`\`\`

### Key Components

#### 1. **Ticket Chatbot** (`components/ticket-chatbot.tsx`)
- Real-time messaging interface
- AI-powered support suggestions
- File upload support
- Automatic status detection and transitions
- Resolved ticket state handling with visual indicators
- Auto-updates Jira status to "In Progress" on first message

#### 2. **Landing Page** (`app/page.tsx`)
- Enterprise-focused design with professional copy
- Platform metrics display:
  - Processing Speed: <5min
  - AI-Accelerated Ticket Handling
  - Enterprise-Grade Response Performance
- Feature showcase with modern SaaS design language
- Ticket dashboard with three columns
- Real-time category updates
- Ticket limit selector (50, 100, 200, 500, 1000)

#### 3. **Pending Page** (`app/ticket-processing/pending/page.tsx`)
- Loading state during ticket creation
- Network speed monitoring (Mbps display)
- Polling check counter
- Optimized polling (2-second intervals)
- Timestamp-based ticket detection
- Animated error button with gradient effect
- Auto-redirect to ticket page on success

#### 4. **Jira API Client** (`lib/jira-api.ts`)
- Full Jira REST API integration
- Single-call ticket fetching (no batch pagination)
- Configurable maxResults with fallback handling
- Status transitions (In Progress, Done, etc.)
- Comment management
- Attachment handling
- Master account detection

#### 5. **Toast System** (`components/ui/toast.tsx`, `components/ui/toaster.tsx`)
- Top-right corner positioning
- Red outline for high visibility
- Manual dismiss only (no auto-hide)
- Success notifications for ticket creation
- Accessible close button

## 📖 User Guide

### For End Users

#### 1. **Submitting a Ticket**

1. Click "Submit Ticket" button on the landing page
2. Compose your email with ticket details
3. Click "Send" to submit
4. You'll see a loading page with:
   - Processing timer
   - Network speed indicator
   - Polling check counter
   - Animated error button (if needed to return home)
5. Once created, you'll be automatically redirected to your ticket
6. A toast notification will appear: "You have created new ticket: [Ticket No.]"

#### 2. **Viewing Your Tickets**

1. Log in with your Google account
2. You'll see your tickets organized in three columns:
   - **In Progress**: Active tickets being worked on
   - **Pending Reply**: Tickets waiting for response
   - **Resolved**: Completed tickets (marked with green checkmark icon)
3. Use the ticket limit dropdown to show 50, 100, 200, or 500 tickets

#### 3. **Opening a Ticket**

1. Click "View Ticket Info" on any ticket card
2. You'll see:
   - Left panel: Ticket details, description, steps to reproduce
   - Right panel: Chat interface for communication

#### 4. **Chatting with Support**

1. Type your message in the chat input at the bottom
2. Click the send button or press Enter
3. **First message automatically updates ticket to "In Progress"**
4. Support will respond in real-time
5. You can attach files by clicking the attachment icon
6. When you send a message, ticket moves to "Pending Reply"

#### 5. **Automatic Status Updates**

- **First message**: Ticket automatically transitions to "In Progress" in Jira
- **Subsequent messages**: Ticket moves to "Pending Reply" category
- **Support resolves**: Ticket moves to "Resolved" column
- **Resolved tickets**: Show green checkmark icon and disable chat

#### 6. **Multiple Ticket Submissions**

- You can submit multiple tickets in succession
- Each submission is tracked with a unique timestamp
- The system won't confuse new tickets with old ones
- Loading page will display for each new ticket

### For Support Team (Master Account)

#### 1. **Master Account Features**

- Access to ALL tickets across all users
- Ability to resolve tickets
- Support mode in chat interface
- Special "Resolve Ticket" button
- Higher ticket limit (up to 1000 tickets)

#### 2. **Resolving Tickets**

1. Open a ticket
2. Click "Resolve Ticket" button in the chat header
3. Confirm the resolution
4. The ticket transitions to "Done" in Jira
5. The ticket moves to "Resolved" column for the user
6. Chat interface is disabled for the user

#### 3. **Viewing All Tickets**

- Master accounts see all tickets in the system
- Tickets are organized by category
- Can select up to 1000 tickets in the dropdown
- Real-time updates every 10 seconds

## 🔌 API Documentation

### Authentication Endpoints

#### `POST /api/auth/google`
Initiates Google OAuth flow.

#### `GET /api/auth/callback/google`
Handles Google OAuth callback.

#### `GET /api/auth/session`
Returns current user session.

**Response:**
\`\`\`json
{
  "email": "user@example.com",
  "name": "User Name",
  "picture": "https://..."
}
\`\`\`

#### `POST /api/auth/signout`
Signs out the current user.

### Ticket Endpoints

#### `GET /api/jira/tickets`
Fetches tickets for the authenticated user with optimized single-call fetching.

**Query Parameters:**
- `userEmail`: User's email address (required)
- `limit`: Number of tickets to fetch (default: 50, max: 500 for users, 1000 for master)

**Response:**
\`\`\`json
{
  "tickets": [...],
  "total": 150,
  "requested": 100,
  "returned": 100
}
\`\`\`

**Features:**
- Single API call (no batch pagination)
- Automatic fallback if Jira limits maxResults
- Master account detection for higher limits
- Comprehensive logging

#### `GET /api/jira/ticket/[key]`
Fetches a single ticket by key.

**Response:**
\`\`\`json
{
  "key": "KST-123",
  "summary": "Ticket title",
  "status": "In Progress",
  "description": "Full ticket description",
  "attachments": [...],
  "comments": [...]
}
\`\`\`

#### `POST /api/jira/ticket/[key]`
Updates ticket status or performs actions.

**Request:**
\`\`\`json
{
  "action": "in-progress" | "resolve",
  "transitionName": "In Progress" | "Done"
}
\`\`\`

**Actions:**
- `in-progress`: Transitions ticket to "In Progress" status
- `resolve`: Transitions ticket to "Done" status

**Response:**
\`\`\`json
{
  "success": true,
  "message": "Ticket status updated successfully"
}
\`\`\`

### Chat Endpoints

#### `POST /api/chat-messages`
Sends a chat message and automatically updates ticket status.

**Request (FormData):**
- `ticketKey`: Ticket key (e.g., "KST-123")
- `userEmail`: Sender's email
- `message`: Message text
- `role`: "user" or "support"
- `file`: (optional) File attachment

**Response:**
\`\`\`json
{
  "success": true,
  "message": "Message sent successfully"
}
\`\`\`

**Automatic Behavior:**
1. Saves message to Supabase `chat_messages` table
2. Posts comment to Jira ticket
3. **First message**: Updates Jira status to "In Progress"
4. **Subsequent messages**: Updates category to "Pending Reply" if currently "In Progress"
5. Uploads file attachments to Jira if provided

#### `GET /api/chat-messages?ticketKey=KST-123`
Fetches all messages for a ticket.

**Response:**
\`\`\`json
{
  "messages": [
    {
      "id": "uuid",
      "ticket_key": "KST-123",
      "user_email": "user@example.com",
      "message": "Message text",
      "role": "user",
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}
\`\`\`

### Status Management

#### `POST /api/jira/ticket/[key]/transition`
Transitions a ticket to a new status.

**Request:**
\`\`\`json
{
  "transitionName": "Done" | "In Progress" | "Pending Reply"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "message": "Ticket transitioned successfully"
}
\`\`\`

## 🔧 Key Functions

### 1. Automatic Ticket Status Transition to "In Progress"

**Location**: `components/ticket-chatbot.tsx`, `app/api/jira/ticket/[key]/route.ts`

**How it works:**
1. When a user sends their first message in the chat
2. The chatbot checks if the ticket is not already "In Progress", "Done", "Resolved", or "Closed"
3. If eligible, it calls the API to transition the ticket to "In Progress"
4. The Jira ticket status is updated immediately
5. The UI reflects the change in real-time

**Code Flow:**
\`\`\`typescript
// 1. User sends message
handleSubmit() {
  // ... send message logic ...
  
  // 2. Check if we should update status
  const shouldUpdateStatus = ticketStatus && 
    !['in progress', 'done', 'resolved', 'closed'].includes(ticketStatus.toLowerCase())
  
  // 3. Update to In Progress
  if (shouldUpdateStatus) {
    await fetch(`/api/jira/ticket/${ticketKey}`, {
      method: 'POST',
      body: JSON.stringify({ action: 'in-progress' })
    })
  }
}
\`\`\`

### 2. Automatic Category Update to "Pending Reply"

**Location**: `app/api/chat-messages/route.ts`

**How it works:**
1. When a message is sent via the chat interface
2. The API checks the current ticket category from Supabase
3. If the category is "In Progress" or doesn't exist
4. The system automatically updates it to "Pending Reply"
5. The frontend refreshes and shows the ticket in the correct column

**Code Flow:**
\`\`\`typescript
// 1. Message is sent
POST /api/chat-messages

// 2. Check current category
const { data: existingCategory } = await supabase
  .from('ticket_categories')
  .select('category')
  .eq('ticket_key', ticketKey)
  .single()

// 3. Update if needed
if (!existingCategory || existingCategory.category === 'In Progress') {
  await supabase
    .from('ticket_categories')
    .upsert({
      ticket_key: ticketKey,
      category: 'Pending Reply',
      updated_at: new Date().toISOString()
    })
}
\`\`\`

### 3. Optimized Ticket Fetching (Single Call)

**Location**: `lib/jira-api.ts`, `app/api/jira/tickets/route.ts`

**How it works:**
1. User selects ticket limit from dropdown (50, 100, 200, 500, 1000)
2. System checks if user is master account
3. Enforces limit: 500 for regular users, 1000 for master
4. Makes a SINGLE API call to Jira with the exact limit
5. If Jira restricts maxResults (e.g., 100 for free plan), automatically reduces
6. Returns tickets with metadata about requested vs returned count

**Code Flow:**
\`\`\`typescript
// 1. Enforce limits
const maxAllowed = isMasterAccount ? 1000 : 500
const finalLimit = Math.min(requestedLimit, maxAllowed)

// 2. Single API call
const response = await fetch(
  `${JIRA_BASE_URL}/rest/api/3/search?jql=${jql}&maxResults=${finalLimit}`
)

// 3. Handle Jira limits
if (response.status === 400) {
  // Retry with maxResults=100
  const fallbackResponse = await fetch(
    `${JIRA_BASE_URL}/rest/api/3/search?jql=${jql}&maxResults=100`
  )
}

// 4. Return with metadata
return {
  tickets: data.issues,
  total: data.total ?? data.issues?.length ?? 0,
  requested: finalLimit,
  returned: data.issues?.length ?? 0
}
\`\`\`

### 4. Timestamp-Based Ticket Detection

**Location**: `app/submit-ticket/page.tsx`, `app/ticket-processing/pending/page.tsx`

**How it works:**
1. When user clicks "Send" to submit a ticket, current timestamp is captured
2. User is redirected to pending page with `submittedAt` parameter
3. Pending page polls for tickets created AFTER that timestamp
4. This prevents finding old tickets when submitting multiple tickets quickly
5. Ensures each submission waits for its own ticket

**Code Flow:**
\`\`\`typescript
// 1. Capture timestamp on submit
router.push(`/ticket-processing/pending?submittedAt=${Date.now()}`)

// 2. Parse timestamp on pending page
const submittedAt = searchParams.get('submittedAt')
const submissionTime = submittedAt ? parseInt(submittedAt) : Date.now()

// 3. Only accept tickets created after submission
const ticketCreatedAt = new Date(ticket.fields.created).getTime()
if (ticketCreatedAt > submissionTime) {
  // This is the new ticket!
  router.push(`/jira-ticket/${ticket.key}?newTicket=true`)
}
\`\`\`

### 5. Network Speed Monitoring

**Location**: `app/ticket-processing/pending/page.tsx`

**How it works:**
1. Uses Network Information API if available (`navigator.connection.downlink`)
2. Fallback: Estimates speed by timing a small fetch request
3. Displays speed in Mbps next to polling check counter
4. Updates on component mount

**Code Flow:**
\`\`\`typescript
// 1. Check for Network Information API
if ('connection' in navigator && 'downlink' in (navigator as any).connection) {
  const downlink = (navigator as any).connection.downlink
  setNetworkSpeed(downlink)
} else {
  // 2. Fallback: estimate with fetch timing
  const startTime = performance.now()
  await fetch('/api/ping', { method: 'HEAD' })
  const endTime = performance.now()
  const duration = endTime - startTime
  const estimatedSpeed = (1 / duration) * 1000 * 8 // Convert to Mbps
  setNetworkSpeed(estimatedSpeed)
}
\`\`\`

### 6. Toast Notification System

**Location**: `app/jira-ticket/[key]/page.tsx`, `components/ui/toast.tsx`

**How it works:**
1. When ticket page loads with `newTicket=true` parameter
2. Displays toast notification in top-right corner
3. Shows "You have created new ticket: [Ticket No.]"
4. Toast has red outline for high visibility
5. Remains visible until user manually closes it
6. URL parameter is cleaned up after showing toast

**Code Flow:**
\`\`\`typescript
// 1. Check for new ticket parameter
const isNewTicket = searchParams.get('newTicket') === 'true'

// 2. Show toast
if (isNewTicket) {
  toast({
    title: "Ticket Successfully Created!",
    description: `You have created new ticket: ${ticketKey}`,
    duration: Infinity, // No auto-dismiss
  })
  
  // 3. Clean up URL
  router.replace(`/jira-ticket/${ticketKey}`)
}
\`\`\`

### 7. Frontend Category Management

**Location**: `app/page.tsx`

**How it works:**
1. Tickets are fetched from Jira with their Jira status
2. The system checks Supabase for frontend category overrides
3. If an override exists, it uses that category
4. Otherwise, it maps the Jira status to a category
5. Tickets are displayed in columns based on their category
6. Real-time updates every 10 seconds

**Code Flow:**
\`\`\`typescript
// 1. Fetch tickets from Jira
const jiraTickets = await fetchJiraTickets(userEmail, ticketLimit)

// 2. Fetch category overrides from Supabase
const { data: categories } = await supabase
  .from('ticket_categories')
  .select('*')

// 3. Apply overrides
const ticketsWithCategories = jiraTickets.map(ticket => {
  const override = categories.find(c => c.ticket_key === ticket.key)
  return {
    ...ticket,
    category: override?.category || mapStatusToCategory(ticket.status)
  }
})

// 4. Group by category
const grouped = {
  'In Progress': ticketsWithCategories.filter(t => t.category === 'In Progress'),
  'Pending Reply': ticketsWithCategories.filter(t => t.category === 'Pending Reply'),
  'Resolved': ticketsWithCategories.filter(t => t.category === 'Resolved')
}

// 5. Real-time updates
useEffect(() => {
  const interval = setInterval(fetchCategories, 10000)
  return () => clearInterval(interval)
}, [])
\`\`\`

### 8. Resolved Ticket Detection

**Location**: `components/ticket-chatbot.tsx`

**How it works:**
1. Checks the ticket's Jira status
2. If status is "Done", "Resolved", "Closed", or "Cancelled"
3. Displays resolved UI with green checkmark icon
4. Disables chat input
5. Shows "This ticket has been Resolved" message

**Code Flow:**
\`\`\`typescript
const isResolved = ticketStatus && 
  ['done', 'resolved', 'closed', 'cancelled'].includes(ticketStatus.toLowerCase())

if (isResolved) {
  return (
    <div className="resolved-state">
      <img src="/images/design-mode/image.png" alt="Resolved" />
      <span>Resolved</span>
      <p>This ticket has been Resolved</p>
    </div>
  )
}
\`\`\`

### 9. Master Account Detection

**Location**: `lib/jira-api.ts`, `components/ticket-chatbot.tsx`, `app/page.tsx`

**How it works:**
1. Compares user email with `NEXT_PUBLIC_MASTER_EMAIL` environment variable
2. If match, grants master account privileges
3. Master accounts can:
   - View all tickets (not just their own)
   - Resolve tickets
   - Access support mode in chat
   - Select up to 1000 tickets in dropdown

**Code Flow:**
\`\`\`typescript
const masterEmail = process.env.NEXT_PUBLIC_MASTER_EMAIL || ''
const isMasterAccount = userEmail.toLowerCase() === masterEmail.toLowerCase()

if (isMasterAccount) {
  // Show all tickets
  // Enable resolve button
  // Set role to 'support'
  // Allow up to 1000 tickets
}
\`\`\`

## 🔄 Workflows

### Ticket Submission Workflow

\`\`\`
1. User clicks "Submit Ticket" button
   ↓
2. Redirected to /submit-ticket page
   ↓
3. Gmail compose window opens
   ↓
4. User writes email and clicks "Send"
   ↓
5. Timestamp captured: submittedAt = Date.now()
   ↓
6. Redirected to /ticket-processing/pending?submittedAt=[timestamp]
   ↓
7. Pending page displays:
   - Processing timer
   - Network speed (Mbps)
   - Polling check counter
   - Animated error button
   ↓
8. System polls every 2 seconds for new ticket
   - Checks for tickets created AFTER submittedAt timestamp
   - Prevents finding old tickets
   ↓
9. Ticket detected!
   ↓
10. Auto-redirect to /jira-ticket/[key]?newTicket=true
    ↓
11. Toast notification appears:
    "You have created new ticket: [Ticket No.]"
    ↓
12. User can now chat with support
\`\`\`

### Chat Message Workflow

\`\`\`
1. User types message in chat
   ↓
2. User clicks send or presses Enter
   ↓
3. Message sent to /api/chat-messages
   ↓
4. API checks: Is this the first message?
   ↓
5a. If first message:
    - Update Jira status to "In Progress"
    - Save message to Supabase
    - Post comment to Jira
    ↓
5b. If subsequent message:
    - Check current category
    - If "In Progress", update to "Pending Reply"
    - Save message to Supabase
    - Post comment to Jira
    ↓
6. Frontend refreshes messages
   ↓
7. Dashboard updates ticket category (10-second polling)
   ↓
8. Ticket appears in correct column
\`\`\`

### Ticket Resolution Workflow

\`\`\`
1. Support opens ticket
   ↓
2. Support clicks "Resolve Ticket" button
   ↓
3. Confirmation dialog appears
   ↓
4. Support confirms resolution
   ↓
5. API call to /api/jira/ticket/[key]
   - action: "resolve"
   - transitionName: "Done"
   ↓
6. Jira ticket status updated to "Done"
   ↓
7. Frontend category updated to "Resolved"
   ↓
8. Ticket moves to "Resolved" column
   ↓
9. Green checkmark icon appears
   ↓
10. Chat interface disabled for user
    ↓
11. User sees "This ticket has been Resolved" message
\`\`\`

### Multiple Ticket Submission Workflow

\`\`\`
Scenario: User submits Ticket A, then immediately submits Ticket B

1. User submits Ticket A at time T1
   ↓
2. Pending page polls for tickets created after T1
   ↓
3. Ticket A created at T1+30s
   ↓
4. System detects Ticket A (created after T1)
   ↓
5. User redirected to Ticket A page
   ↓
6. User returns to home and submits Ticket B at time T2
   ↓
7. Pending page polls for tickets created after T2
   ↓
8. System ignores Ticket A (created before T2)
   ↓
9. Ticket B created at T2+30s
   ↓
10. System detects Ticket B (created after T2)
    ↓
11. User redirected to Ticket B page
    ↓
Result: No confusion between tickets!
\`\`\`

## 🐛 Troubleshooting

### Common Issues

#### 1. "Failed to send message" Error

**Cause**: API endpoint receiving wrong data format (JSON vs FormData)

**Solution**: 
- Ensure `app/api/chat-messages/route.ts` is parsing FormData correctly
- Check that the chatbot component is sending FormData, not JSON
- Verify file upload handling if attachments are involved

#### 2. Tickets Not Moving to "Pending Reply"

**Cause**: 
- Supabase table doesn't exist
- Permissions issue
- Category update logic not executing

**Solution**:
- Run the SQL script to create `ticket_categories` table
- Check Supabase logs for errors
- Add console.log statements to trace execution
- Verify environment variables are set correctly
- Check that `SUPABASE_SERVICE_ROLE_KEY` is set

#### 3. Ticket Not Transitioning to "In Progress"

**Cause**:
- Jira workflow doesn't have "In Progress" transition
- API call failing
- Ticket already in a final state

**Solution**:
- Check Jira workflow for available transitions
- Verify ticket status in Jira
- Check browser console for API errors
- Ensure `JIRA_API_TOKEN` has correct permissions

#### 4. Multiple Tickets Showing Same Ticket

**Cause**: Timestamp parameter not being passed or parsed correctly

**Solution**:
- Verify `submittedAt` parameter in URL
- Check that pending page is parsing the timestamp
- Ensure ticket detection logic compares timestamps correctly
- Clear browser cache and try again

#### 5. Toast Notification Not Appearing

**Cause**:
- `newTicket` parameter not in URL
- Toast system not initialized
- Toaster component not rendered

**Solution**:
- Check URL for `?newTicket=true` parameter
- Verify `<Toaster />` component is in layout
- Check browser console for errors
- Ensure `useToast` hook is imported correctly

#### 6. Network Speed Not Displaying

**Cause**:
- Network Information API not supported
- Fetch timing estimation failing
- State not updating

**Solution**:
- Check browser compatibility (Chrome/Edge recommended)
- Verify `/api/ping` endpoint exists
- Check browser console for errors
- Ensure state is initialized correctly

#### 7. Error Button Not Visible

**Cause**:
- CSS classes not applied
- Tailwind not compiling animations
- Z-index issues

**Solution**:
- Check that Tailwind CSS is loaded
- Verify `animate-pulse` class is available
- Inspect element to see applied styles
- Check for conflicting CSS

#### 8. Ticket Limit Not Working

**Cause**:
- API not receiving limit parameter
- Jira API restricting maxResults
- Master account detection failing

**Solution**:
- Check network tab for API call parameters
- Verify `limit` query parameter is sent
- Check if Jira free plan limits apply
- Verify `NEXT_PUBLIC_MASTER_EMAIL` is set correctly

#### 9. Authentication Issues

**Cause**:
- Google OAuth not configured
- Session cookie not being set
- NEXTAUTH_URL incorrect

**Solution**:
- Verify Google OAuth credentials in Google Cloud Console
- Check that redirect URIs are correct
- Ensure NEXTAUTH_SECRET is set
- Clear browser cookies and try again

#### 10. Jira API Errors

**Cause**:
- Invalid API token
- Incorrect base URL
- Missing permissions

**Solution**:
- Regenerate Jira API token
- Verify JIRA_BASE_URL format (no trailing slash)
- Check Jira user has necessary permissions
- Test API token with curl:
  \`\`\`bash
  curl -u email@example.com:api-token \
    https://your-domain.atlassian.net/rest/api/3/myself
  \`\`\`

### Debug Mode

Enable detailed logging by checking the browser console for `[v0]` prefixed messages:

\`\`\`typescript
console.log("[v0] Message sent:", messageData)
console.log("[v0] Category updated:", category)
console.log("[v0] Ticket status:", status)
console.log("[v0] Network speed:", speed)
console.log("[v0] Polling check:", checkCount)
\`\`\`

### Performance Optimization

**Slow Ticket Loading:**
- Reduce ticket limit in dropdown
- Check network speed indicator
- Verify Jira API response time
- Consider caching strategies

**Slow Polling:**
- Polling interval is 2 seconds (optimized)
- Check network speed
- Verify API endpoint performance
- Consider WebSocket for real-time updates

## 📝 License

This project is built with [v0.app](https://v0.app) and deployed on Vercel.

## 🤝 Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review the [API Documentation](#api-documentation)
3. Check the [Workflows](#workflows) section
4. Contact the development team

## 🔗 Links

- **Live App**: [https://vercel.com/royes-projects-6bcfe66f/v0-remix-of-agent-chain-workflow](https://vercel.com/royes-projects-6bcfe66f/v0-remix-of-agent-chain-workflow)
- **v0 Project**: [https://v0.app/chat/projects/UvhNKFShjip](https://v0.app/chat/projects/UvhNKFShjip)
- **Jira**: [Your Jira Instance]
- **Supabase**: [Your Supabase Project]

---

**Built with ❤️ using v0.app, Next.js 15, and Supabase**

# Integrum Helpdesk System

*A comprehensive ticket management and support system with Jira integration, real-time chat, and intelligent automation*

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
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

Integrum is a modern helpdesk system that seamlessly integrates with Jira to provide a streamlined ticket management experience. It features real-time chat communication, intelligent ticket status automation, email monitoring, and a beautiful user interface built with Next.js and Tailwind CSS.

## ✨ Features

### Core Functionality

- **🎫 Jira Integration**: Full bidirectional sync with Jira for ticket management
- **💬 Real-time Chat**: Built-in messaging system with AI-powered support suggestions
- **🤖 Intelligent Automation**: Automatic ticket status transitions based on user interactions
- **📧 Email Monitoring**: Gmail integration for automatic ticket acknowledgment detection
- **📎 File Attachments**: Support for uploading and managing ticket attachments
- **🔐 Authentication**: Secure Google OAuth authentication with role-based access
- **📊 Dashboard**: Organized ticket views with "In Progress", "Pending Reply", and "Resolved" columns
- **🎨 Modern UI**: Beautiful, responsive interface with dark mode support

### Advanced Features

- **Frontend Category Management**: Independent ticket categorization system using Supabase
- **Automatic Status Detection**: Monitors chat activity and updates ticket status automatically
- **Master Account Support**: Special privileges for support team members
- **Resolved Ticket Indicators**: Visual badges and icons for completed tickets
- **Custom Scrollbar Styling**: Enhanced UX with themed scrollbars
- **Responsive Design**: Optimized for desktop and mobile devices

## 🛠 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Google OAuth
- **External APIs**: 
  - Jira REST API v3
  - Gmail API
  - N8N Workflow Automation
- **UI Components**: shadcn/ui
- **State Management**: React Hooks + SWR

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
JIRA_BASE_URL=https://your-domain.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=your-jira-api-token
JIRA_PROJECT_KEY=KST
NEXT_PUBLIC_JIRA_BASE_URL=https://your-domain.atlassian.net

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000

# Supabase
SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_JWT_SECRET=your-jwt-secret

# PostgreSQL (from Supabase)
POSTGRES_URL=your-postgres-url
POSTGRES_PRISMA_URL=your-prisma-url
POSTGRES_URL_NON_POOLING=your-non-pooling-url
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-password
POSTGRES_DATABASE=postgres
POSTGRES_HOST=your-host

# N8N Workflow Automation
N8N_API_KEY=your-n8n-api-key
N8N_API_URL=https://your-n8n-instance.com

# Master Account
NEXT_PUBLIC_MASTER_EMAIL=support@example.com
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
│   │   ├── tickets/              # Ticket management
│   │   └── email/                # Email webhook handlers
│   ├── jira-ticket/[key]/        # Individual ticket view
│   ├── page.tsx                  # Main dashboard (Your Ticket Page)
│   └── globals.css               # Global styles
├── components/                   # React Components
│   ├── ticket-chatbot.tsx        # Chat interface component
│   ├── ui/                       # shadcn/ui components
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
- Automatic status detection
- Resolved ticket state handling

#### 2. **Your Ticket Page** (`app/page.tsx`)
- Main dashboard with three columns:
  - **In Progress**: Active tickets being worked on
  - **Pending Reply**: Tickets awaiting response
  - **Resolved**: Completed tickets with visual indicators
- Real-time category updates
- Ticket filtering and organization

#### 3. **Jira API Client** (`lib/jira-api.ts`)
- Full Jira REST API integration
- Ticket fetching and filtering
- Status transitions
- Comment management
- Attachment handling

## 📖 User Guide

### For End Users

#### 1. **Viewing Your Tickets**

1. Log in with your Google account
2. You'll see your tickets organized in three columns:
   - **In Progress**: Tickets currently being worked on
   - **Pending Reply**: Tickets waiting for your response or support's response
   - **Resolved**: Completed tickets (marked with a green checkmark icon)

#### 2. **Opening a Ticket**

1. Click "View Ticket Info" on any ticket card
2. You'll see:
   - Left panel: Ticket details, description, steps to reproduce, etc.
   - Right panel: Chat interface for communication

#### 3. **Chatting with Support**

1. Type your message in the chat input at the bottom
2. Click the send button or press Enter
3. Support will respond in real-time
4. You can attach files by clicking the attachment icon

#### 4. **Automatic Status Updates**

- When you send a message on an "In Progress" ticket, it automatically moves to "Pending Reply"
- When support resolves your ticket, it moves to the "Resolved" column
- Resolved tickets show a green checkmark icon and disable the chat interface

### For Support Team (Master Account)

#### 1. **Master Account Features**

- Access to ALL tickets across all users
- Ability to resolve tickets
- Support mode in chat interface
- Special "Resolve Ticket" button

#### 2. **Resolving Tickets**

1. Open a ticket
2. Click "Resolve Ticket" button in the chat header
3. Confirm the resolution
4. The ticket moves to "Resolved" column for the user

#### 3. **Viewing All Tickets**

- Master accounts see all tickets in the system
- Tickets are organized by status
- Can filter and search across all users

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
Fetches all tickets for the authenticated user.

**Query Parameters:**
- `userEmail`: User's email address

**Response:**
\`\`\`json
{
  "tickets": [
    {
      "key": "KST-123",
      "summary": "Ticket title",
      "status": "In Progress",
      "category": "In Progress",
      "created": "2025-01-01T00:00:00Z",
      "updated": "2025-01-02T00:00:00Z",
      "description": "Ticket description",
      "reporter": "user@example.com"
    }
  ]
}
\`\`\`

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

### Chat Endpoints

#### `POST /api/chat-messages`
Sends a chat message.

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
- Saves message to Supabase `chat_messages` table
- Posts comment to Jira ticket
- If ticket is "In Progress", updates category to "Pending Reply"
- Uploads file attachments to Jira if provided

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
  "transitionName": "Done"
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

### 1. Automatic Ticket Status Transition

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

### 2. Frontend Category Management

**Location**: `app/page.tsx`

**How it works:**
1. Tickets are fetched from Jira with their Jira status
2. The system checks Supabase for frontend category overrides
3. If an override exists, it uses that category
4. Otherwise, it maps the Jira status to a category
5. Tickets are displayed in columns based on their category

**Code Flow:**
\`\`\`typescript
// 1. Fetch tickets from Jira
const jiraTickets = await fetchJiraTickets(userEmail)

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
\`\`\`

### 3. Resolved Ticket Detection

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
      <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-VW9yekTIz5tAHKi7QeDNuYcuvnoT1S.png" alt="Resolved" />
      <span>Resolved</span>
      <p>This ticket has been Resolved</p>
    </div>
  )
}
\`\`\`

### 4. Jira Status to Category Mapping

**Location**: `lib/jira-api.ts`

**How it works:**
Maps Jira status names to frontend categories.

**Mapping:**
\`\`\`typescript
function mapStatusToCategory(status: string): TicketCategory {
  const statusLower = status.toLowerCase()
  
  // Resolved statuses
  if (['done', 'resolved', 'closed', 'cancelled'].includes(statusLower)) {
    return 'Resolved'
  }
  
  // Pending statuses
  if (['pending reply', 'waiting for customer', 'pending'].includes(statusLower)) {
    return 'Pending Reply'
  }
  
  // Default to In Progress
  return 'In Progress'
}
\`\`\`

### 5. Master Account Detection

**Location**: `lib/jira-api.ts`, `components/ticket-chatbot.tsx`

**How it works:**
1. Compares user email with `NEXT_PUBLIC_MASTER_EMAIL` environment variable
2. If match, grants master account privileges
3. Master accounts can:
   - View all tickets
   - Resolve tickets
   - Access support mode in chat

**Code Flow:**
\`\`\`typescript
const masterEmail = process.env.NEXT_PUBLIC_MASTER_EMAIL || ''
const isMasterAccount = userEmail.toLowerCase() === masterEmail.toLowerCase()

if (isMasterAccount) {
  // Show all tickets
  // Enable resolve button
  // Set role to 'support'
}
\`\`\`

### 6. File Upload Handling

**Location**: `app/api/chat-messages/route.ts`, `components/ticket-chatbot.tsx`

**How it works:**
1. User selects file in chat interface
2. File is sent as FormData to API
3. API uploads file to Jira as attachment
4. File is linked to the ticket

**Code Flow:**
\`\`\`typescript
// Frontend
const formData = new FormData()
formData.append('file', selectedFile)
formData.append('ticketKey', ticketKey)
formData.append('message', message)

// Backend
const file = formData.get('file') as File
if (file) {
  const jiraClient = new JiraApiClient(jiraConfig)
  await jiraClient.addAttachment(ticketKey, file)
}
\`\`\`

### 7. Real-time Category Updates

**Location**: `app/page.tsx`

**How it works:**
1. Uses `setInterval` to poll Supabase every 10 seconds
2. Fetches latest category overrides
3. Updates ticket display automatically
4. Ensures UI stays in sync with database

**Code Flow:**
\`\`\`typescript
useEffect(() => {
  const interval = setInterval(async () => {
    const { data } = await supabase
      .from('ticket_categories')
      .select('*')
    
    setTicketCategories(data || [])
  }, 10000) // Every 10 seconds
  
  return () => clearInterval(interval)
}, [])
\`\`\`

## 🐛 Troubleshooting

### Common Issues

#### 1. "Failed to send message" Error

**Cause**: API endpoint receiving wrong data format (JSON vs FormData)

**Solution**: 
- Ensure `app/api/chat-messages/route.ts` is parsing FormData correctly
- Check that the chatbot component is sending FormData, not JSON

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

#### 3. Authentication Issues

**Cause**:
- Google OAuth not configured
- Session cookie not being set
- NEXTAUTH_URL incorrect

**Solution**:
- Verify Google OAuth credentials in Google Cloud Console
- Check that redirect URIs are correct
- Ensure NEXTAUTH_SECRET is set
- Clear browser cookies and try again

#### 4. Jira API Errors

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

#### 5. Resolved Tickets Still Showing Chat

**Cause**: Resolved status check not working

**Solution**:
- Check ticket status in Jira
- Verify `isResolved` logic in `ticket-chatbot.tsx`
- Ensure status names match (case-insensitive)

### Debug Mode

Enable detailed logging by checking the browser console for `[v0]` prefixed messages:

\`\`\`typescript
console.log("[v0] Message sent:", messageData)
console.log("[v0] Category updated:", category)
console.log("[v0] Ticket status:", status)
\`\`\`

## 📝 License

This project is built with [v0.app](https://v0.app) and deployed on Vercel.

## 🤝 Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review the [API Documentation](#api-documentation)
3. Contact the development team

## 🔗 Links

- **Live App**: [https://vercel.com/royes-projects-6bcfe66f/v0-remix-of-agent-chain-workflow](https://vercel.com/royes-projects-6bcfe66f/v0-remix-of-agent-chain-workflow)
- **v0 Project**: [https://v0.app/chat/projects/UvhNKFShjip](https://v0.app/chat/projects/UvhNKFShjip)
- **Jira**: [Your Jira Instance]
- **Supabase**: [Your Supabase Project]

---

**Built with ❤️ using v0.app, Next.js, and Supabase**

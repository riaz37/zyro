<p align="center">
  <img src="public/zyro-logo.svg" alt="Zyro Logo" width="120" />
</p>

<h1 align="center">Zyro</h1>

<p align="center">
  <strong>AI-Powered Web Application Generator</strong>
</p>

<p align="center">
  Transform natural language prompts into fully functional, live Next.js applications — instantly.
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#how-it-works">How It Works</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#tech-stack">Tech Stack</a>
</p>

---

## ✨ Features

### 🤖 Multi-Provider AI Support
Generate applications using your preferred AI provider:
- **Google Gemini** (gemini-2.0-flash)
- **OpenAI** (gpt-4o-mini)
- **Anthropic Claude** (claude-3-5-sonnet, claude-3-5-haiku)
- **xAI Grok** (grok-2-latest)
- **OpenRouter** (devstral-2512, mistral-7b-instruct)

### 🔒 Secure Key Management
Encrypted API key storage with AES-256-GCM encryption. Bring your own API keys — stored securely with your user account.

### 🖥️ Live Sandboxed Execution
Each generation runs in an isolated E2B sandbox with:
- Pre-configured Next.js 15.3.3 environment
- Full file system access
- Terminal command execution
- Hot module reloading
- Isolated port 3000 preview

### 💬 Conversational Development
Iterate on your applications through natural conversation:
- Multi-turn context retention
- Incremental feature additions
- Real-time code modifications

### 🎨 Production-Ready Output
Generated apps include:
- TypeScript throughout
- Tailwind CSS styling
- shadcn/ui components (pre-installed)
- Responsive layouts
- Accessibility best practices

---

## 🧠 How It Works

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER PROMPT                                     │
│                    "Build a todo app with dark mode"                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ZYRO ORCHESTRATION                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │   Clerk     │    │    tRPC     │    │   Inngest   │    │   Prisma    │  │
│  │    Auth     │───▶│     API     │───▶│   Events    │───▶│   Storage   │  │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AI AGENT NETWORK                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │                        CODE AGENT                                     │  │
│   │  • System prompt with Next.js/Tailwind/shadcn expertise              │  │
│   │  • Tools: terminal, createOrUpdateFile, readFile                     │  │
│   │  • Iterates until <task_summary> generated                           │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                     │                                        │
│                                     ▼                                        │
│   ┌────────────────────┐     ┌────────────────────┐                         │
│   │  Title Generator   │     │ Response Generator │                         │
│   │  (3-word summary)  │     │  (User message)    │                         │
│   └────────────────────┘     └────────────────────┘                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           E2B SANDBOX                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │  Isolated Next.js 15.3.3 Environment                                 │  │
│   ├──────────────────────────────────────────────────────────────────────┤  │
│   │  📁 /home/user                                                       │  │
│   │  ├── app/                     ← Generated pages & components         │  │
│   │  │   ├── page.tsx                                                    │  │
│   │  │   ├── layout.tsx                                                  │  │
│   │  │   └── [components].tsx                                            │  │
│   │  ├── components/ui/           ← Pre-installed shadcn components      │  │
│   │  ├── lib/utils.ts             ← Utilities (cn, etc.)                 │  │
│   │  └── package.json                                                    │  │
│   ├──────────────────────────────────────────────────────────────────────┤  │
│   │  🖥️  Dev server running on port 3000 with hot reload                │  │
│   │  🔧  npm available for dependency installation                       │  │
│   │  📂  Full file system read/write access                              │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           LIVE PREVIEW                                       │
│              https://[sandbox-id].e2b.dev • Shareable URL                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Architecture

### System Overview

Zyro is built as a modern, event-driven system using Next.js 15 with a sophisticated agent-based AI backend:

```
zyro/
├── src/
│   ├── app/                    # Next.js 15 App Router
│   │   ├── (home)/             # Authenticated routes
│   │   ├── api/                # API endpoints (tRPC, Inngest)
│   │   └── projects/           # Project views
│   │
│   ├── components/             # UI Components
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── code-view/          # Code editor & preview
│   │   ├── file-explorer.tsx   # File tree navigation
│   │   └── tree-view.tsx       # Directory structure
│   │
│   ├── modules/                # Feature modules
│   │   ├── home/               # Dashboard
│   │   ├── projects/           # Project management
│   │   ├── messages/           # Chat interface
│   │   └── api-keys/           # Key management
│   │
│   ├── inngest/                # Background job processing
│   │   ├── functions.ts        # AI agent orchestration
│   │   ├── client.ts           # Inngest client
│   │   └── utils.ts            # Sandbox utilities
│   │
│   ├── trpc/                   # Type-safe API layer
│   │   ├── routers/            # API route definitions
│   │   ├── server.tsx          # Server utilities
│   │   └── client.tsx          # Client utilities
│   │
│   ├── lib/                    # Shared utilities
│   │   ├── prisma.ts           # Database client
│   │   ├── ai-keys/            # Encryption utilities
│   │   └── utils.ts            # Helper functions
│   │
│   └── prompt.ts               # AI system prompts
│
├── prisma/
│   └── schema.prisma           # Database schema
│
└── sandbox-template/           # E2B sandbox config
    └── nextjs/                 # Next.js template
```

### Data Models

```prisma
model Project {
  id        String    @id @default(uuid())
  name      String
  userId    String
  messages  Message[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model Message {
  id        String      @id @default(uuid())
  content   String
  role      MessageRole // USER | ASSISTANT
  type      MessageType // RESULT | ERROR
  projectId String?
  Fragment  Fragment?
}

model Fragment {
  id         String @id @default(uuid())
  messageId  String @unique
  sandboxUrl String          # Live preview URL
  sandboxId  String?         # E2B sandbox identifier
  title      String          # AI-generated title
  files      Json            # Generated file contents
}

model UserAiProviderKey {
  id         String     @id @default(uuid())
  userId     String
  provider   AiProvider // GEMINI | OPENAI | ANTHROPIC | GROK | OPENROUTER
  iv         Bytes              # Encryption IV
  ciphertext Bytes              # Encrypted key
  authTag    Bytes              # Auth tag
  last4      String             # Display hint
}
```

### AI Agent System

The core of Zyro is an **Inngest Agent Kit** powered network:

| Agent | Purpose | Model |
|-------|---------|-------|
| **Code Agent** | Generates and modifies application code | Provider's primary model |
| **Title Generator** | Creates 3-word fragment titles | Provider's fast model |
| **Response Generator** | Writes user-friendly completion messages | Provider's fast model |

**Available Tools:**

| Tool | Description |
|------|-------------|
| `terminal` | Execute shell commands (npm install, etc.) |
| `createOrUpdateFile` | Write files to the sandbox |
| `readFile` | Read existing file contents |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+** with pnpm
- **PostgreSQL** database
- **Clerk** account for authentication
- **E2B** account for sandbox execution
- **Inngest** account for event processing

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/riaz37/zyro.git
   cd zyro
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env.local
   ```

   ```env
   # Database
   DATABASE_URL="postgresql://user:pass@host:5432/zyro"
   
   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
   CLERK_SECRET_KEY="sk_..."
   
   # E2B Sandbox
   E2B_API_KEY="e2b_..."
   
   # Inngest
   INNGEST_EVENT_KEY="..."
   INNGEST_SIGNING_KEY="..."
   
   # Encryption (generate with: openssl rand -hex 32)
   ENCRYPTION_KEY="..."
   ```

4. **Initialize database**
   ```bash
   pnpm prisma migrate dev
   pnpm prisma generate
   ```

5. **Start development server**
   ```bash
   pnpm dev
   ```

6. **Start Inngest dev server** (separate terminal)
   ```bash
   npx inngest-cli@latest dev
   ```

Open [http://localhost:3000](http://localhost:3000) to start generating!

---

## 🔧 Tech Stack

### Core Framework
| Technology | Version | Purpose |
|------------|---------|---------|
| [Next.js](https://nextjs.org) | 16.0.10 | React framework with App Router |
| [React](https://react.dev) | 19.2.3 | UI library |
| [TypeScript](https://typescriptlang.org) | 5.9.3 | Type safety |

### AI & Agents
| Technology | Purpose |
|------------|---------|
| [Inngest Agent Kit](https://inngest.com/docs/agent-kit) | Multi-agent orchestration |
| [E2B](https://e2b.dev) | Sandboxed code execution |

### Database & API
| Technology | Purpose |
|------------|---------|
| [Prisma](https://prisma.io) | ORM & migrations |
| [PostgreSQL](https://postgresql.org) | Database |
| [tRPC](https://trpc.io) | Type-safe API |
| [TanStack Query](https://tanstack.com/query) | Data fetching |

### UI & Styling
| Technology | Purpose |
|------------|---------|
| [Tailwind CSS](https://tailwindcss.com) | Utility-first CSS |
| [shadcn/ui](https://ui.shadcn.com) | UI components |
| [Radix UI](https://radix-ui.com) | Accessible primitives |
| [Lucide](https://lucide.dev) | Icons |

### Auth & Infrastructure
| Technology | Purpose |
|------------|---------|
| [Clerk](https://clerk.com) | Authentication |
| [Inngest](https://inngest.com) | Event-driven background jobs |
| [Sonner](https://sonner.emilkowal.ski) | Toast notifications |

---

## 📝 Example Prompts

Try these prompts to see Zyro in action:

| Prompt | What You'll Get |
|--------|-----------------|
| *"Create a todo app with dark mode"* | Full CRUD todo list with theme toggle |
| *"Build a weather dashboard with charts"* | Dashboard layout with data visualization |
| *"Make a portfolio website with contact form"* | Multi-section portfolio with form validation |
| *"Create a music player interface"* | Audio player UI with playlist management |
| *"Build a Kanban board like Trello"* | Drag-and-drop task management |
| *"Design a Twitter/X clone feed"* | Social media feed with interactions |

---

## 🔒 Security

- **Encrypted API Keys**: User API keys are encrypted with AES-256-GCM before storage
- **Isolated Sandboxes**: Each code generation runs in an isolated E2B sandbox
- **Authentication**: All routes protected with Clerk authentication
- **Input Validation**: Zod schemas validate all API inputs

---

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server with Turbopack |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm prisma studio` | Open Prisma database GUI |
| `pnpm prisma migrate dev` | Run database migrations |

---

## 🤝 Contributing

Contributions are welcome! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/riaz37">riaz37</a>
</p>

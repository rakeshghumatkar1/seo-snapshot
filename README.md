# SEO Snapshot - AI-Powered SEO Advisory Reports

A premium AI-driven SEO report generator built for business owners and founders. This tool provides consulting-grade, business-first advisory reports without technical jargon.

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Neon PostgreSQL** (via @neondatabase/serverless)
- **Deployed on Vercel**

## Features

- ✅ Free AI-powered snapshot reports
- ✅ Detailed premium reports with comprehensive analysis
- ✅ Email capture for lead generation
- ✅ PDF download capability (coming soon)
- ✅ User rating system
- ✅ Premium SaaS-style UI
- ✅ Mobile-responsive design

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your credentials:

```env
DATABASE_URL=your_neon_database_url
OPENAI_API_KEY=your_openai_api_key
AI_PROVIDER=mock  # Change to 'openai' to enable real AI
```

### 3. Set Up Database (Optional)

If you want to store leads and ratings, set up a Neon PostgreSQL database:

1. Create a Neon account at https://neon.tech
2. Create a new project
3. Copy the connection string to `DATABASE_URL`
4. Run the schema SQL from `lib/db/schema.ts`

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
seo-tool/
├── app/                      # Next.js App Router pages
│   ├── page.tsx             # Home page
│   ├── tool/page.tsx        # Tool input page
│   ├── report/page.tsx      # Report result page
│   ├── how-it-works/        # How It Works page
│   ├── about/               # About page
│   ├── faq/                 # FAQ page
│   ├── contact/             # Contact page
│   └── api/                 # API routes
│       ├── report/
│       │   ├── snapshot/    # Snapshot report generation
│       │   └── detailed/    # Detailed report generation
│       ├── leads/           # Lead capture
│       ├── ratings/         # Rating submission
│       └── config/          # Feature toggles
├── components/
│   ├── layout/              # Header, Footer
│   ├── ui/                  # Reusable UI components
│   └── report/              # Report-specific components
├── lib/
│   ├── ai/                  # AI integration (currently mocked)
│   │   ├── prompts/         # AI prompts
│   │   ├── provider.ts      # AI provider logic
│   │   ├── generateSnapshotReport.ts
│   │   ├── generateDetailedReport.ts
│   │   └── parseReport.ts
│   ├── db/                  # Database setup
│   │   ├── schema.ts        # Database schema
│   │   └── client.ts        # Neon client
│   └── config.ts            # Feature toggles
└── types/                   # TypeScript types
```

## Enabling Real AI

Currently, the app uses **mock data** for reports. To enable real AI:

1. Get an OpenAI API key from https://platform.openai.com
2. Add it to `.env.local`:
   ```env
   OPENAI_API_KEY=sk-...
   AI_PROVIDER=openai
   ```
3. Restart the development server

The AI integration is located in `lib/ai/`:
- **Prompts**: `lib/ai/prompts/snapshotPrompt.ts` and `detailedPrompt.ts`
- **Provider**: `lib/ai/provider.ts` (handles OpenAI API calls)
- **Generators**: `generateSnapshotReport.ts` and `generateDetailedReport.ts`
- **Parser**: `parseReport.ts` (extracts sections from AI response)

## Feature Toggles

Feature toggles are managed in `lib/config.ts` and exposed via `/api/config`:

- `enableDetailedReport`: Show/hide detailed report option
- `enablePDFDownload`: Show/hide PDF download button
- `enableRating`: Show/hide rating block
- `requireEmailForDetailed`: Require email for detailed reports
- `requireEmailForPDF`: Require email for PDF downloads

## Database Schema

The app uses four tables:

- **leads**: Stores email captures and user information
- **reports**: Stores generated reports
- **ratings**: Stores user feedback
- **config**: Stores feature toggles (optional)

See `lib/db/schema.ts` for the full schema and SQL.

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

The app is optimized for Vercel deployment with Next.js 14.

## What's Mocked vs Real

### Currently Mocked:
- ✅ AI report generation (returns static mock data)
- ✅ PDF download (shows "coming soon" alert)
- ✅ Contact form submission (demo only)

### Currently Real:
- ✅ All UI and page navigation
- ✅ Email modal and lead capture flow
- ✅ Rating submission
- ✅ Feature toggle system
- ✅ Database integration (if configured)

## Next Steps

1. **Enable Real AI**: Add OpenAI API key and set `AI_PROVIDER=openai`
2. **Set Up Database**: Configure Neon PostgreSQL for lead storage
3. **Implement PDF Generation**: Add PDF generation library (e.g., jsPDF, Puppeteer)
4. **Add Email Service**: Integrate email service for report delivery
5. **Customize Branding**: Update colors, logo, and copy to match your brand

## License

MIT

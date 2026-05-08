#  Buildex — The AI-Powered Learning IDE

Buildex is a complete, production-ready full-stack web application designed for a modern AI-powered learning platform. It features a stunning landing page, a real-time analytics dashboard powered by Google Sheets, and a dynamic video showcase wall backed by Supabase.

##  Features

1. **Stunning Landing Page**: Premium, glassmorphism-based UI featuring advanced Framer Motion scroll animations, dynamic glowing backgrounds, and a high-converting hero section.
2. **Live Analytics Dashboard**: A single-screen, high-density live dashboard for real-time monitoring. Fetches data directly from a published Google Sheet CSV and visualizes it using beautiful Recharts components (custom progress bars, distribution charts, and stats).
3. **Video Wall & Showcase**: A fully functional video upload and streaming gallery powered by Supabase Storage and Postgres.

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + Custom Glassmorphism Utilities
- **Animations**: Framer Motion
- **Data Source (Analytics)**: Google Sheets CSV (SWR live-refresh)
- **Database & Storage (Videos)**: Supabase (Postgres + Storage)
- **Charts**: Recharts

## 💻 Getting Started

### 1. Clone & Install
```bash
git clone <repository-url>
cd buildex
npm install
```

### 2. Environment Variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SHEET_CSV_URL=your-google-sheet-csv-url
```

### 3. Supabase Setup (For Video Wall)
Buildex uses Supabase **only** for storing uploaded showcase videos and their metadata. The live analytics data comes entirely from the Google Sheet live CSV.

1. **Create a Supabase Project**
   - Go to [Supabase](https://supabase.com/) and create a new project.
   - Copy the **Project URL** and the **anon `public` key** to your `.env.local`.

2. **Set up the Database Table**
   - Go to the **SQL Editor** in the Supabase dashboard and run:
   ```sql
   create table videos (
     id uuid default gen_random_uuid() primary key,
     created_at timestamptz default now(),
     title text not null,
     uploader text not null,
     description text,
     storage_path text not null,
     public_url text not null
   );
   ```

3. **Set up the Storage Bucket**
   - Go to **Storage** and click **New Bucket**.
   - Name the bucket exactly: `project-videos`
   - Check **Public bucket** (so users can view the videos).

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🚀 Deployment

This project is fully optimized and configured for zero-config deployment on Vercel.
```bash
npx vercel
```
Make sure to add your Environment Variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SHEET_CSV_URL`) in the Vercel dashboard.

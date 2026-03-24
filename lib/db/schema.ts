export interface Lead {
  id: number;
  email: string;
  name?: string;
  company?: string;
  website_url: string;
  requested_report_type: 'snapshot' | 'detailed' | 'pdf';
  created_at: Date;
}

export interface Report {
  id: number;
  website_url: string;
  report_type: 'snapshot' | 'detailed';
  email?: string;
  status: 'pending' | 'success' | 'failed';
  ai_response_text?: string;
  created_at: Date;
}

export interface Rating {
  id: number;
  website_url: string;
  email?: string;
  rating: number;
  comment?: string;
  created_at: Date;
}

export interface Config {
  key: string;
  value: string;
}

export const CREATE_TABLES_SQL = `
-- Leads table
CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  company VARCHAR(255),
  website_url TEXT NOT NULL,
  requested_report_type VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
  id SERIAL PRIMARY KEY,
  website_url TEXT NOT NULL,
  report_type VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  ai_response_text TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ratings table
CREATE TABLE IF NOT EXISTS ratings (
  id SERIAL PRIMARY KEY,
  website_url TEXT NOT NULL,
  email VARCHAR(255),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Config table
CREATE TABLE IF NOT EXISTS config (
  key VARCHAR(255) PRIMARY KEY,
  value TEXT NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_website ON leads(website_url);
CREATE INDEX IF NOT EXISTS idx_reports_website ON reports(website_url);
CREATE INDEX IF NOT EXISTS idx_ratings_website ON ratings(website_url);
`;

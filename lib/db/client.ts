import { neon } from '@neondatabase/serverless';

export function getDbClient() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.warn('DATABASE_URL not set, database operations will fail');
    return null;
  }
  
  return neon(databaseUrl);
}

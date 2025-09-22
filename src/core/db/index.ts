// Re-export connection
export { dbConnection } from './connection.js';

// Re-export all repos
export * from './repos/index.js';

// Legacy compatibility functions
export async function initializeDatabase() {
  await dbConnection.init();
  return dbConnection.getDb();
}

export function getDatabase() {
  return dbConnection.getDb();
}

export function closeDatabase() {
  return dbConnection.close();
}
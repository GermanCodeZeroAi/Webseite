import { beforeAll, afterAll } from 'vitest';
import { dbConnection } from '../src/core/db/connection.js';

beforeAll(async () => {
  // Initialize in-memory database for testing
  await dbConnection.init(':memory:');
});

afterAll(async () => {
  // Close database connection
  await dbConnection.close();
});
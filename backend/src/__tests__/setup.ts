const testDatabaseUrl = process.env.TEST_DATABASE_URL;

if (!testDatabaseUrl) {
  throw new Error(
    'Refusing to run destructive integration tests without TEST_DATABASE_URL. ' +
    'Create a dedicated test database and set TEST_DATABASE_URL before running npm test.'
  );
}

// The integration suite clears its database in beforeAll. Keep that operation
// isolated from the development or deployed database even when backend/.env is
// present locally.
process.env.DATABASE_URL = testDatabaseUrl;
process.env.DIRECT_URL = process.env.TEST_DIRECT_URL ?? testDatabaseUrl;
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-only-jwt-secret';

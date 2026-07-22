import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const envPath = path.resolve(rootDir, '.env.test.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const dbUrlTest = process.env.DATABASE_URL_TEST;
const redisUrlTest = process.env.REDIS_URL_TEST;

if (!dbUrlTest) {
  console.error("❌ DATABASE_URL_TEST is required");
  process.exit(1);
}

if (!redisUrlTest) {
  console.error("❌ REDIS_URL_TEST is required");
  process.exit(1);
}

const dbUrlObj = new URL(dbUrlTest);
if (dbUrlObj.port !== '5433') {
  console.error(`❌ Integration tests require PostgreSQL port 5433. Found: ${dbUrlObj.port}`);
  process.exit(1);
}
if (!dbUrlObj.pathname.endsWith('_test')) {
  console.error(`❌ Integration tests require database name to end with _test. Found: ${dbUrlObj.pathname}`);
  process.exit(1);
}

const redisUrlObj = new URL(redisUrlTest);
if (redisUrlObj.port !== '6380') {
  console.error(`❌ Integration tests require Redis port 6380. Found: ${redisUrlObj.port}`);
  process.exit(1);
}

const runCmd = (cmd, env = {}) => {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { cwd: rootDir, stdio: 'inherit', env: { ...process.env, ...env } });
};

try {
  console.log("\n🚀 Starting infrastructure for integration tests...");
  runCmd("docker compose -f infra/docker/docker-compose.test.yml up -d");
  
  console.log("\n⏳ Waiting for database to be ready...");
  // Sleep for a few seconds to let DB start
  runCmd("node -e \"setTimeout(() => {}, 3000)\"");

  console.log("\n🔄 Running database migrations...");
  runCmd("pnpm --filter @repo/database exec prisma migrate deploy", { DATABASE_URL: dbUrlTest });

  console.log("\n🧪 Running integration tests...");
  runCmd("pnpm --filter @repo/api run test:integration", { DATABASE_URL_TEST: dbUrlTest, REDIS_URL_TEST: redisUrlTest });
  
  console.log("\n✅ Integration tests completed successfully!");
} catch (error) {
  console.error("\n❌ Integration tests failed!");
  process.exit(1);
} finally {
  console.log("\n🛑 Stopping infrastructure...");
  try {
    runCmd("docker compose -f infra/docker/docker-compose.test.yml down -v");
  } catch(e) {
    console.error("Failed to stop infrastructure", e);
  }
}

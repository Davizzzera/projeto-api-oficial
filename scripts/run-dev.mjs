import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load root .env
const envPath = path.join(rootDir, '.env');
if (fs.existsSync(envPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  for (const k in envConfig) {
    if (!process.env[k]) {
      process.env[k] = envConfig[k];
    }
  }
}

// Forward args
const args = process.argv.slice(2);

const child = spawn('npx', ['turbo', 'run', 'dev', ...args], {
  cwd: rootDir,
  stdio: 'inherit',
  env: process.env,
  shell: true,
});

function handleSignal(signal) {
  if (child.pid) {
    child.kill(signal);
  }
  process.exit(0);
}

process.on('SIGINT', () => handleSignal('SIGINT'));
process.on('SIGTERM', () => handleSignal('SIGTERM'));

child.on('close', (code) => {
  process.exit(code ?? 0);
});

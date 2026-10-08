/**
 * Say It Right Test Runner
 * Provides clean terminal reporting for all test suites
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n==========================================');
console.log('🧪 Running Say It Right Test Suites');
console.log('==========================================\n');

const testFile = path.resolve(__dirname, 'index.test.ts');

const child = spawn(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['tsx', '--test', testFile],
  {
    stdio: 'inherit',
    shell: true,
  }
);

child.on('close', (code) => {
  console.log('\n==========================================');
  if (code === 0) {
    console.log('✅ All tests passed successfully!');
  } else {
    console.log(`❌ Tests exited with error code ${code}`);
  }
  console.log('==========================================\n');
  process.exit(code ?? 1);
});

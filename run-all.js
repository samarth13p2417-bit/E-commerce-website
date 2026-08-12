const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Multi-Tenant E-Commerce SaaS Week 1 Full Stack...');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

// Start backend
const backend = spawn('node', ['server.js'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit',
  shell: isWindows
});

// Start frontend
const frontend = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.join(__dirname, 'frontend'),
  stdio: 'inherit',
  shell: isWindows
});

process.on('SIGINT', () => {
  backend.kill();
  frontend.kill();
  process.exit();
});

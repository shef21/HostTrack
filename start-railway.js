const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting HostTrack Full Stack Application on Railway...');

// Set environment variables for Railway
process.env.BACKEND_PORT = process.env.PORT || 3001;
process.env.FRONTEND_PORT = (parseInt(process.env.PORT || 3001) + 1).toString();

console.log(`🔧 Backend will run on port: ${process.env.BACKEND_PORT}`);
console.log(`🌐 Frontend will run on port: ${process.env.FRONTEND_PORT}`);

// Start backend
const backend = spawn('npm', ['start'], {
    cwd: path.join(__dirname, 'backend'),
    stdio: 'inherit',
    env: { ...process.env, PORT: process.env.BACKEND_PORT }
});

// Start frontend
const frontend = spawn('npm', ['start'], {
    cwd: path.join(__dirname, 'web'),
    stdio: 'inherit',
    env: { ...process.env, PORT: process.env.FRONTEND_PORT }
});

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down services...');
    backend.kill('SIGINT');
    frontend.kill('SIGINT');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down services...');
    backend.kill('SIGTERM');
    frontend.kill('SIGTERM');
    process.exit(0);
});

// Handle child process errors
backend.on('error', (error) => {
    console.error('❌ Backend error:', error);
});

frontend.on('error', (error) => {
    console.error('❌ Frontend error:', error);
});

console.log('✅ Both services started successfully!');
console.log(`🔗 Backend API: http://localhost:${process.env.BACKEND_PORT}`);
console.log(`🌐 Frontend: http://localhost:${process.env.FRONTEND_PORT}`);

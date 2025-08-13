module.exports = {
  apps: [{
    name: 'hosttrack-backend',
    script: 'server.js',
    cwd: '/var/www/hosttrack/backend',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: '/var/log/hosttrack/err.log',
    out_file: '/var/log/hosttrack/out.log',
    log_file: '/var/log/hosttrack/combined.log',
    time: true,
    max_memory_restart: '1G',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};

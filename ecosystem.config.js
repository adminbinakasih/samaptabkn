module.exports = {
  apps: [
    {
      name: 'bkn-backend',
      script: './backend/server.js',
      cwd: '/var/www/bkn-running',
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
    },
    {
      name: 'bkn-frontend',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: '/var/www/bkn-running/frontend',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      instances: 1,
      autorestart: true,
      watch: false,
    },
  ],
};

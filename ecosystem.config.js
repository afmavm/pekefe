module.exports = {
  apps: [
    {
      name: 'pekefe-app',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 4000',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
        NODE_OPTIONS: '--max-old-space-size=512',
        UV_THREADPOOL_SIZE: '2',
        CHECKPOINT_DISABLE: '1',
        PRISMA_HIDE_UPDATE_MESSAGE: '1',
      },
    },
  ],
};

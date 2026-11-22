module.exports = {
  apps: [
    {
      name: 'pekefe-app',
      cwd: __dirname,
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 4000',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      treekill: true,
      kill_timeout: 5000,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
        NODE_OPTIONS: '--max-old-space-size=512',
        UV_THREADPOOL_SIZE: '2',
        TOKIO_WORKER_THREADS: '1',
        RAYON_NUM_THREADS: '1',
        CHECKPOINT_DISABLE: '1',
        PRISMA_HIDE_UPDATE_MESSAGE: '1',
      },
    },
  ],
};

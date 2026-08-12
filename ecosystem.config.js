module.exports = {
  apps: [
    {
      name: 'pekefe-app',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 4000',
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
    },
  ],
};

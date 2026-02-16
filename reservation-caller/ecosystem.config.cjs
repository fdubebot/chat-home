module.exports = {
  apps: [
    {
      name: "reservation-caller",
      cwd: "/home/fdube/.openclaw/workspace/reservation-caller",
      script: "dist/server.js",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      max_restarts: 20,
      watch: false,
      env: {
        NODE_ENV: "production",
      },
      out_file: "/tmp/reservation-caller.out.log",
      error_file: "/tmp/reservation-caller.err.log",
      merge_logs: true,
      time: true,
    },
  ],
};

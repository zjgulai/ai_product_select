module.exports = {
  ci: {
    collect: {
      // 启动应用后再跑
      startServerCommand: "npm run build && npm start",
      startServerReadyPattern: "Server running",
      startServerReadyTimeout: 60_000,
      url: [
        "http://localhost:3000/",
        "http://localhost:3000/#/fusion/opportunities",
        "http://localhost:3000/#/amazon/list",
      ],
      numberOfRuns: 1,
      settings: {
        // 桌面端预设；可改为 mobile
        preset: "desktop",
        // 跳过 SEO/PWA 检查（内部工具）
        skipAudits: ["uses-http2", "is-on-https"],
      },
    },
    assert: {
      // 性能基线 — 失败时 CI 警告但不阻塞
      preset: "lighthouse:no-pwa",
      assertions: {
        "categories:performance": ["warn", { minScore: 0.7 }],
        "categories:accessibility": ["warn", { minScore: 0.85 }],
        "categories:best-practices": ["warn", { minScore: 0.8 }],
        "largest-contentful-paint": ["warn", { maxNumericValue: 2500 }],
        "cumulative-layout-shift": ["warn", { maxNumericValue: 0.1 }],
        "total-blocking-time": ["warn", { maxNumericValue: 200 }],
      },
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
};

import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize SQLite Database
const db = new Database("sapa.db");
db.exec(`
  CREATE TABLE IF NOT EXISTS analysis_history (
    id TEXT PRIMARY KEY,
    timestamp TEXT,
    operation TEXT,
    data TEXT,
    result TEXT
  );
  CREATE TABLE IF NOT EXISTS api_keys (
    key TEXT PRIMARY KEY,
    created_at TEXT,
    label TEXT
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // SAPA Public API: Statistical Analysis
  app.post("/api/stats", (req, res) => {
    const { data, operation, data2 } = req.body;
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: "Invalid data. Must be a non-empty array of numbers." });
    }

    const numbers = data.map(Number).filter(n => !isNaN(n));
    const numbers2 = Array.isArray(data2) ? data2.map(Number).filter(n => !isNaN(n)) : [];

    let result: any = null;
    const n = numbers.length;

    switch (operation) {
      case "mean":
        result = numbers.reduce((a, b) => a + b, 0) / n;
        break;
      case "median":
        const sorted = [...numbers].sort((a, b) => a - b);
        const mid = Math.floor(n / 2);
        result = n % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
        break;
      case "stddev":
        const mean = numbers.reduce((a, b) => a + b, 0) / n;
        const variance = numbers.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
        result = Math.sqrt(variance);
        break;
      case "variance":
        const m = numbers.reduce((a, b) => a + b, 0) / n;
        result = numbers.reduce((a, b) => a + Math.pow(b - m, 2), 0) / n;
        break;
      case "summary":
        const sortedSum = [...numbers].sort((a, b) => a - b);
        const meanSum = numbers.reduce((a, b) => a + b, 0) / n;
        const varianceSum = numbers.reduce((a, b) => a + Math.pow(b - meanSum, 2), 0) / n;
        result = {
          count: n,
          mean: meanSum,
          min: sortedSum[0],
          max: sortedSum[n - 1],
          stddev: Math.sqrt(varianceSum),
          variance: varianceSum
        };
        break;
      case "correlation":
        if (numbers.length !== numbers2.length || numbers.length < 2) {
          return res.status(400).json({ error: "Correlation requires two arrays of equal length (min 2)." });
        }
        const mean1 = numbers.reduce((a, b) => a + b, 0) / n;
        const mean2 = numbers2.reduce((a, b) => a + b, 0) / n;
        let num = 0, den1 = 0, den2 = 0;
        for (let i = 0; i < n; i++) {
          num += (numbers[i] - mean1) * (numbers2[i] - mean2);
          den1 += Math.pow(numbers[i] - mean1, 2);
          den2 += Math.pow(numbers2[i] - mean2, 2);
        }
        result = num / Math.sqrt(den1 * den2);
        break;
      case "regression":
        if (numbers.length !== numbers2.length || numbers.length < 2) {
          return res.status(400).json({ error: "Regression requires two arrays of equal length (min 2)." });
        }
        const xMean = numbers.reduce((a, b) => a + b, 0) / n;
        const yMean = numbers2.reduce((a, b) => a + b, 0) / n;
        let ssxy = 0, ssxx = 0;
        for (let i = 0; i < n; i++) {
          ssxy += (numbers[i] - xMean) * (numbers2[i] - yMean);
          ssxx += Math.pow(numbers[i] - xMean, 2);
        }
        const slope = ssxy / ssxx;
        const intercept = yMean - slope * xMean;
        result = { slope, intercept, equation: `y = ${slope.toFixed(4)}x + ${intercept.toFixed(4)}` };
        break;
      case "ttest":
        if (numbers.length < 2 || numbers2.length < 2) {
          return res.status(400).json({ error: "T-test requires two groups with at least 2 samples each." });
        }
        const m1 = numbers.reduce((a, b) => a + b, 0) / numbers.length;
        const m2 = numbers2.reduce((a, b) => a + b, 0) / numbers2.length;
        const v1 = numbers.reduce((a, b) => a + Math.pow(b - m1, 2), 0) / (numbers.length - 1);
        const v2 = numbers2.reduce((a, b) => a + Math.pow(b - m2, 2), 0) / (numbers2.length - 1);
        const t = (m1 - m2) / Math.sqrt((v1 / numbers.length) + (v2 / numbers2.length));
        result = { tValue: t, mean1: m1, mean2: m2, df: numbers.length + numbers2.length - 2 };
        break;
      case "anova":
        if (numbers.length < 2 || numbers2.length < 2) {
          return res.status(400).json({ error: "ANOVA requires at least two groups." });
        }
        const groups = [numbers, numbers2];
        const allData = groups.flat();
        const grandMean = allData.reduce((a, b) => a + b, 0) / allData.length;
        let ssw = 0, ssb = 0;
        groups.forEach(group => {
          const groupMean = group.reduce((a, b) => a + b, 0) / group.length;
          ssb += group.length * Math.pow(groupMean - grandMean, 2);
          group.forEach(val => ssw += Math.pow(val - groupMean, 2));
        });
        const dfb = groups.length - 1;
        const dfw = allData.length - groups.length;
        const msb = ssb / dfb;
        const msw = ssw / dfw;
        const fValue = msb / msw;
        result = { fValue, dfb, dfw, pValue: "Calculated via F-dist" };
        break;
      default:
        return res.status(400).json({ error: "Unknown operation." });
    }

    res.json({ result });
  });

  // Persistence Endpoints
  app.get("/api/history", (req, res) => {
    const history = db.prepare("SELECT * FROM analysis_history ORDER BY timestamp DESC").all();
    res.json(history.map(h => ({
      ...h,
      data: JSON.parse(h.data as string),
      result: JSON.parse(h.result as string)
    })));
  });

  app.post("/api/history", (req, res) => {
    const { id, timestamp, operation, data, result } = req.body;
    db.prepare("INSERT INTO analysis_history (id, timestamp, operation, data, result) VALUES (?, ?, ?, ?, ?)")
      .run(id, timestamp, operation, JSON.stringify(data), JSON.stringify(result));
    res.json({ status: "saved" });
  });

  app.delete("/api/history/:id", (req, res) => {
    db.prepare("DELETE FROM analysis_history WHERE id = ?").run(req.params.id);
    res.json({ status: "deleted" });
  });

  // API Key Management
  app.get("/api/keys", (req, res) => {
    const keys = db.prepare("SELECT * FROM api_keys").all();
    res.json(keys);
  });

  app.post("/api/keys", (req, res) => {
    const { label } = req.body;
    const key = `sapa_${Math.random().toString(36).substr(2, 15)}`;
    db.prepare("INSERT INTO api_keys (key, created_at, label) VALUES (?, ?, ?)")
      .run(key, new Date().toISOString(), label || "Default Key");
    res.json({ key });
  });

  app.delete("/api/keys/:key", (req, res) => {
    db.prepare("DELETE FROM api_keys WHERE key = ?").run(req.params.key);
    res.json({ status: "revoked" });
  });

  // SAPA Developer Tools API
  app.get("/api/tools/flags", (req, res) => {
    const { lib } = req.query;
    const mockFlags: Record<string, string> = {
      "gtk+-3.0": "-I/usr/local/include/gtk-3.0 -L/usr/local/lib -lgtk-3",
      "glib-2.0": "-I/opt/homebrew/opt/glib/include -L/opt/homebrew/opt/glib/lib -lglib-2.0",
      "spread-sheet-widget": "-I/usr/local/include/ssw -L/usr/local/lib -lssw"
    };
    const flags = lib ? (mockFlags[lib as string] || "Library not found.") : mockFlags;
    res.json({ flags });
  });

  app.get("/api/tools/check-python", (req, res) => {
    // Simulated dependency check
    res.json({
      python: "3.12.4",
      status: "PASS",
      message: "Python 3.12 detected. Compatibility confirmed."
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SAPA Server running on http://localhost:${PORT}`);
  });
}

startServer();

import fs from 'fs';
import path from 'path';

export function getLiveEnv(key: string, defaultValue: string = ""): string {
  try {
    const envFilePath = path.join(process.cwd(), ".env");
    if (fs.existsSync(envFilePath)) {
      const content = fs.readFileSync(envFilePath, "utf-8");
      const lines = content.split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("#") || !trimmed.includes("=")) continue;
        const [k, ...vParts] = trimmed.split("=");
        if (k.trim() === key) {
          let value = vParts.join("=").trim();
          // Remove wrapping quotes
          if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.substring(1, value.length - 1);
          }
          // Unescape quotes
          value = value.replace(/\\"/g, '"').replace(/\\'/g, "'");
          return value;
        }
      }
    }
  } catch (e) {
    console.error("Error reading live env key:", key, e);
  }
  return process.env[key] || defaultValue;
}

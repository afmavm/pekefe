import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { speedScore, loadTime, interactivity, visualStability, serverResponse } = body;

    const dataPath = path.join(process.cwd(), "src", "data", "scan-results.json");
    
    const newResults = {
      speedScore: Number(speedScore) || 87,
      loadTime: loadTime || "2.54s",
      interactivity: interactivity || "124ms",
      visualStability: visualStability || "0.05",
      serverResponse: serverResponse || "1.2s",
      lastScanDate: new Date().toLocaleString("tr-TR")
    };

    fs.writeFileSync(dataPath, JSON.stringify(newResults, null, 2), "utf8");

    return NextResponse.json({ success: true, results: newResults });
  } catch (error: any) {
    console.error("Error saving scan results:", error);
    return NextResponse.json({ error: error.message || "Failed to save scan results" }, { status: 500 });
  }
}

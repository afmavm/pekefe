import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { queryGeminiSupport } from "@/modules/ai-assistant/gemini-chat";

export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    // Kullanıcı oturumunu al
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role || "GUEST";
    const userEmail = session?.user?.email || undefined;

    // Gemini AI destekli Atak Destek servisine yönlendir
    const reply = await queryGeminiSupport(message, userRole, userEmail);

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

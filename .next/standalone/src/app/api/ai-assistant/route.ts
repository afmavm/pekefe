import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { queryAiAssistant } from "@/modules/ai-assistant/knowledgeBase";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 1. Parse JSON body
    const body = await req.json();
    const message = body.message;

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    // 2. Secure endpoint using NextAuth session tokens
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role || "GUEST";
    const userEmail = session?.user?.email || undefined;

    // 3. Process query using our context-aware Knowledge Base router
    const replyText = await queryAiAssistant(message, userRole, userEmail);

    // 4. Stream response chunk-by-chunk in UTF-8 encoding
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Stream character-by-character or small words with tiny delay
        const words = replyText.split(" ");
        for (let i = 0; i < words.length; i++) {
          const chunk = words[i] + (i === words.length - 1 ? "" : " ");
          controller.enqueue(encoder.encode(chunk));
          // Tiny dynamic thinking delay to simulate real AI stream
          await new Promise((r) => setTimeout(r, 25));
        }
        controller.close();
      },
    });

    // 5. Return Event Stream response
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("AI ERP Assistant stream error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

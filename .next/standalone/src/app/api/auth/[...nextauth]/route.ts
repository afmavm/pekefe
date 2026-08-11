import NextAuth from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { withRateLimit } from "@/lib/rate-limit";
import { NextRequest } from "next/server";

const handler = NextAuth(authOptions);

async function authHandler(req: NextRequest, context: any) {
  const rateLimitResponse = await withRateLimit(req, "authLimit");
  if (rateLimitResponse) return rateLimitResponse;

  return handler(req, context);
}

export { authHandler as GET, authHandler as POST };


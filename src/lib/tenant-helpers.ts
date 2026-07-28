import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Checks in the database if the given company has the feature enabled.
 * Fallback / Server Action context check.
 */
export async function checkCompanyFeature(
  companyId: string | null | undefined,
  featureKey: string
): Promise<boolean> {
  if (!companyId) {
    // Single-tenant or unassigned company gets all features by default
    return true;
  }

  try {
    const permission = await prisma.companyPermission.findFirst({
      where: {
        companyId: companyId,
        featureModule: {
          key: featureKey
        }
      }
    });

    return permission ? permission.isEnabled : false;
  } catch (error) {
    console.error(`Error in checkCompanyFeature for company ${companyId} and feature ${featureKey}:`, error);
    return false;
  }
}

/**
 * Asserts in a Server Action or API handler that a feature is enabled.
 * Throws an error if not enabled.
 */
export async function assertCompanyFeature(featureKey: string): Promise<void> {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error("Yetkisiz erişim. Oturum bulunamadı.");
  }
  
  const user = session.user as any;
  const companyFeatures = user.companyFeatures || [];
  
  if (!companyFeatures.includes(featureKey)) {
    throw new Error(`Erişim engellendi. Bu şirket için '${featureKey}' modülü aktif değil.`);
  }
}

/**
 * Checks if a feature is enabled for the current session.
 * Returns a NextResponse (403 Forbidden) if disabled, or null if enabled.
 */
export async function requireCompanyFeature(featureKey: string): Promise<NextResponse | null> {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json(
      { error: "Oturum bulunamadı.", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const user = session.user as any;
  const companyFeatures = user.companyFeatures || [];
  
  if (!companyFeatures.includes(featureKey)) {
    return NextResponse.json(
      { 
        error: `Bu firmaya ait '${featureKey}' modülü pasif durumdadır.`, 
        code: "FEATURE_DISABLED",
        statusCode: 403
      },
      { status: 403 }
    );
  }

  return null;
}

/**
 * Higher-order helper to wrap an API route handler with feature flagging checks.
 */
export function withCompanyFeature<T = any>(
  featureKey: string,
  handler: (req: any, context: any) => Promise<NextResponse> | NextResponse
) {
  return async (req: any, context: any) => {
    const errorResponse = await requireCompanyFeature(featureKey);
    if (errorResponse) {
      return errorResponse;
    }
    return handler(req, context);
  };
}

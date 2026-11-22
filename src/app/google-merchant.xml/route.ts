import { NextRequest, NextResponse } from "next/server";
import {
  generateGoogleMerchantXml,
  generateGoogleMerchantTsv,
} from "@/lib/google-merchant-feed";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = (searchParams.get("format") || "xml").toLowerCase();

    if (format === "tsv") {
      const tsv = await generateGoogleMerchantTsv();
      return new NextResponse(tsv, {
        status: 200,
        headers: {
          "Content-Type": "text/tab-separated-values; charset=utf-8",
          "Content-Disposition": 'inline; filename="pekefe-google-merchant.tsv"',
          "Cache-Control": "public, max-age=300, s-maxage=300",
        },
      });
    }

    const xml = await generateGoogleMerchantXml();
    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=300, s-maxage=300",
      },
    });
  } catch (err) {
    console.error("[GOOGLE MERCHANT XML ERROR]:", err);
    return new NextResponse("Feed oluşturulamadı", { status: 500 });
  }
}

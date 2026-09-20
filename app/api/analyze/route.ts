import { NextRequest, NextResponse } from "next/server";
import { analyzeScam } from "@/lib/analyzer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = await analyzeScam({
      text: body.text,
      image: body.image,
      mimeType: body.mimeType,
    });
    return NextResponse.json(data, { status: 200 });
  } catch (err: any) {
    console.error("Analysis API route error:", err);
    return NextResponse.json(
      { error: err?.message || "Analysis failed. Please check the input or try again." },
      { status: 400 }
    );
  }
}

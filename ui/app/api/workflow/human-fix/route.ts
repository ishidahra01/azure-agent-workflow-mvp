import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const instanceId = searchParams.get("instanceId");

    if (!instanceId) {
      return NextResponse.json(
        { error: "instanceId is required" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7071/api";

    const response = await fetch(
      `${API_URL}/workflows/${instanceId}/events/human-fix`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data, { status: 202 });
  } catch (error) {
    console.error("Error sending human fix:", error);
    return NextResponse.json(
      { error: "Failed to send human fix" },
      { status: 500 }
    );
  }
}

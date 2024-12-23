import { NextResponse } from "next/server";
import AI from "@/service/assisterr";

export async function POST() {
  try {
    // Create a chat session
    const session_ID = await AI.createChat();

    return NextResponse.json({
      sessionId: session_ID,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "An error occured",
      },
      { status: 400 }
    );
  }
}

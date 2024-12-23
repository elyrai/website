import AI from "@/service/assisterr";
import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { TokenProvider } from "@/service/token";
import generateReview from "@/service/review";

const CA_REGEX = /\b[1-9A-HJ-NP-Za-km-z]{32,44}\b/g;

export async function POST(request: Request) {
  try {
    const { message, sessionId } = await request.json();

    // Check if the message includes a CA and if it does extract it
    const CA = (message as string).match(CA_REGEX);
    const token = CA ? CA[0] : null;

    if (token) {
      const cachedTokenData = await unstable_cache(
        async () => {
          const tokenProvider = new TokenProvider(token);
          const tokenData = await tokenProvider.getProcessedTokenData();
          const objectTokenData = await tokenProvider.getObject(tokenData);
          const tokenFormatted = await tokenProvider.getFormattedTweetReport(
            tokenData
          );
          return {
            tokenData: objectTokenData,
            tokenFormatted,
          };
        },
        [`token-${token}`],
        { revalidate: 60 * 15 }
      )();
      const review = await generateReview(sessionId, cachedTokenData.tokenData);
      const response = cachedTokenData.tokenFormatted + "\n" + review.message;
      return NextResponse.json({ message: response });
    }

    // Call OpenAI API
    const res =
      (await AI.sendMessage(sessionId, message)) || "I didn't understand that.";

    // Send back the AI response
    return NextResponse.json(res);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to generate a response." },
      { status: 500 }
    );
  }
}

export function GET() {
  return NextResponse.json(
    { message: "This endpoint only accepts POST requests." },
    { status: 405 }
  );
}

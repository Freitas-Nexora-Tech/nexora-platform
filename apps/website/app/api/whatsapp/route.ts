import { NextRequest } from "next/server";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const VERIFY_TOKEN =
  process.env.WHATSAPP_VERIFY_TOKEN;

export async function GET(
  request: NextRequest
) {
  const searchParams =
    request.nextUrl.searchParams;

  const mode =
    searchParams.get("hub.mode");

  const token =
    searchParams.get("hub.verify_token");

  const challenge =
    searchParams.get("hub.challenge");

  console.log("WhatsApp webhook diagnostic:", {
    mode,
    tokenReceived: Boolean(token),
    verifyTokenPresent: Boolean(VERIFY_TOKEN),
    tokenLength: token?.length ?? 0,
    verifyTokenLength:
      VERIFY_TOKEN?.length ?? 0,
    tokensMatch:
      Boolean(token) &&
      Boolean(VERIFY_TOKEN) &&
      token === VERIFY_TOKEN,
    challengeReceived: Boolean(challenge),
  });

  if (
    mode === "subscribe" &&
    token &&
    VERIFY_TOKEN &&
    token === VERIFY_TOKEN
  ) {
    console.log(
      "WhatsApp webhook verificado com sucesso."
    );

    return new Response(challenge, {
        status: 200,
      headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "no-store, no-cache, must-revalidate",
     },
    });
  }

  return new Response("Forbidden", {
    status: 403,
    headers: {
    "Cache-Control": "no-store, no-cache, must-revalidate",
  },
  });
}

export async function POST(
  request: NextRequest
) {
  try {
    const body = await request.json();

    console.log(
      "WhatsApp webhook recebido:",
      JSON.stringify(body, null, 2)
    );

    return Response.json(
      {
        success: true,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Erro ao processar webhook WhatsApp:",
      error
    );

    return Response.json(
      {
        success: false,
      },
      {
        status: 200,
      }
    );
  }
}
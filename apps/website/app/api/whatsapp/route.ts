import { NextRequest } from "next/server";

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

  console.log("WhatsApp webhook verification:", {
    mode,
    tokenProvided: Boolean(token),
    challengeProvided: Boolean(challenge),
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
      },
    });
  }

  console.error(
    "Falha na verificação do webhook WhatsApp."
  );

  return new Response("Forbidden", {
    status: 403,
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

    /*
     * Mesmo que o conteúdo recebido seja inválido,
     * mantemos uma resposta controlada para evitar
     * problemas de processamento no endpoint.
     */
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
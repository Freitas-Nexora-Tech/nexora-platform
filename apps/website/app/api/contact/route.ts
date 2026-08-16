import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { nome, email, empresa, mensagem } = await request.json();

    const dataHora = new Date().toLocaleString("pt-PT", {
      timeZone: "Europe/Madrid",
      dateStyle: "full",
      timeStyle: "short",
    });

    await resend.emails.send({
      from: "Nexora Website <onboarding@resend.dev>",
      to: ["contacto@nexoratech.pt"],
      subject: `Novo pedido de contacto — ${nome}`,
      replyTo: email,

      html: `
        <div style="font-family: Arial, sans-serif; max-width: 700px; margin: auto; color: #1e293b;">

          <div style="background: #020617; padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: #22d3ee; margin: 0;">
              Nexora Tech
            </h1>
            <p style="color: #cbd5e1; margin-top: 8px;">
              Novo pedido de contacto
            </p>
          </div>

          <div style="padding: 30px; border: 1px solid #e2e8f0;">

            <h2 style="margin-top: 0;">
              Dados do contacto
            </h2>

            <p>
              <strong>Nome:</strong><br>
              ${nome}
            </p>

            <p>
              <strong>Email:</strong><br>
              ${email}
            </p>

            <p>
              <strong>Empresa:</strong><br>
              ${empresa || "Não indicada"}
            </p>

            <p>
              <strong>Data e hora:</strong><br>
              ${dataHora}
            </p>

            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 25px 0;">

            <h2>Mensagem</h2>

            <div style="
              background: #f8fafc;
              padding: 20px;
              border-radius: 8px;
              white-space: pre-wrap;
            ">
              ${mensagem}
            </div>

          </div>

          <div style="
            background: #020617;
            padding: 20px;
            text-align: center;
            border-radius: 0 0 12px 12px;
          ">
            <p style="color: #94a3b8; margin: 0;">
              Mensagem enviada através do site Nexora Tech
            </p>
          </div>

        </div>
      `,
    });

    return Response.json({
      success: true,
    });

  } catch (error) {
    console.error("Erro ao enviar email:", error);

    return Response.json(
      {
        error: "Não foi possível enviar a mensagem.",
      },
      {
        status: 500,
      }
    );
  }
}
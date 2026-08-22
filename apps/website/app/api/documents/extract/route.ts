import { PDFParse } from "pdf-parse";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const BUCKET = "company-documents";

export async function POST(request: Request) {
  try {
    const supabase =
      await createSupabaseServerClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return Response.json(
        {
          error: "É necessário iniciar sessão.",
        },
        { status: 401 }
      );
    }

    const {
      data: membro,
      error: membroError,
    } = await supabase
      .from("company_members")
      .select("company_id")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    if (membroError || !membro) {
      return Response.json(
        {
          error:
            "A sua conta não está associada a nenhuma empresa.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const documentId = body?.documentId;

    if (
      typeof documentId !== "string" ||
      !documentId.trim()
    ) {
      return Response.json(
        {
          error:
            "É necessário indicar o documento.",
        },
        { status: 400 }
      );
    }

    // Procurar apenas documentos da empresa do utilizador
    const {
      data: documento,
      error: documentoError,
    } = await supabase
      .from("company_documents")
      .select(
        "id, company_id, file_name, storage_path, mime_type"
      )
      .eq("id", documentId)
      .eq("company_id", membro.company_id)
      .single();

    if (documentoError || !documento) {
      console.error(
        "Documento não encontrado:",
        documentoError
      );

      return Response.json(
        {
          error:
            "Documento não encontrado ou sem permissão.",
        },
        { status: 404 }
      );
    }

    if (
      documento.mime_type !==
      "application/pdf"
    ) {
      return Response.json(
        {
          error:
            "A extração de texto nesta etapa suporta apenas ficheiros PDF.",
        },
        { status: 400 }
      );
    }

    // Baixar o PDF do Storage privado
    const {
      data: ficheiro,
      error: downloadError,
    } = await supabase.storage
      .from(BUCKET)
      .download(
        documento.storage_path
      );

    if (downloadError || !ficheiro) {
      console.error(
        "Erro ao baixar documento:",
        downloadError
      );

      return Response.json(
        {
          error:
            "Não foi possível obter o PDF.",
        },
        { status: 500 }
      );
    }

    const buffer =
      Buffer.from(
        await ficheiro.arrayBuffer()
      );

    // Extrair texto com pdf-parse v2
    const parser = new PDFParse({
      data: buffer,
    });

    try {
      const resultado =
        await parser.getText();

      const texto =
        resultado.text?.trim() || "";

      if (!texto) {
        return Response.json(
          {
            error:
              "Não foi possível encontrar texto neste PDF.",
          },
          { status: 422 }
        );
      }

      // Guardar texto extraído
      const {
        error: updateError,
      } = await supabase
        .from("company_documents")
        .update({
          extracted_text: texto,
        })
        .eq(
          "id",
          documento.id
        )
        .eq(
          "company_id",
          membro.company_id
        );

      if (updateError) {
        console.error(
          "Erro ao guardar texto:",
          updateError
        );

        return Response.json(
          {
            error:
              "O texto foi extraído, mas não foi possível guardá-lo.",
          },
          { status: 500 }
        );
      }

      return Response.json({
        success: true,
        message:
          "Texto extraído com sucesso.",
        documentId:
          documento.id,
        fileName:
          documento.file_name,
        characters:
          texto.length,
      });
    } finally {
      await parser.destroy();
    }
  } catch (error) {
    console.error(
      "Erro ao extrair documento:",
      error
    );

    return Response.json(
      {
        error:
          "Ocorreu um erro ao extrair o texto do documento.",
      },
      { status: 500 }
    );
  }
}

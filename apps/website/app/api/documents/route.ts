import { createSupabaseServerClient } from "@/lib/supabase-server";

const BUCKET = "company-documents";
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const TIPOS_PERMITIDOS = new Set([
  "application/pdf",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const EXTENSOES_PERMITIDAS = new Set([
  ".pdf",
  ".txt",
  ".docx",
]);

function obterExtensao(nome: string) {
  const ultimoPonto = nome.lastIndexOf(".");

  if (ultimoPonto === -1) {
    return "";
  }

  return nome
    .slice(ultimoPonto)
    .toLowerCase();
}

function nomeSeguro(nome: string) {
  return nome
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_");
}

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
          error:
            "É necessário iniciar sessão.",
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
      console.error(
        "Erro ao encontrar empresa:",
        membroError
      );

      return Response.json(
        {
          error:
            "A sua conta não está associada a nenhuma empresa.",
        },
        { status: 403 }
      );
    }

    const formData =
      await request.formData();

    const ficheiro =
      formData.get("file");

    if (!(ficheiro instanceof File)) {
      return Response.json(
        {
          error:
            "É necessário selecionar um ficheiro.",
        },
        { status: 400 }
      );
    }

    if (ficheiro.size <= 0) {
      return Response.json(
        {
          error:
            "O ficheiro está vazio.",
        },
        { status: 400 }
      );
    }

    if (ficheiro.size > MAX_FILE_SIZE) {
      return Response.json(
        {
          error:
            "O ficheiro não pode ultrapassar 10 MB.",
        },
        { status: 400 }
      );
    }

    const extensao =
      obterExtensao(ficheiro.name);

    if (
      !EXTENSOES_PERMITIDAS.has(
        extensao
      )
    ) {
      return Response.json(
        {
          error:
            "Tipo de ficheiro não permitido. Utilize PDF, TXT ou DOCX.",
        },
        { status: 400 }
      );
    }

    if (
      ficheiro.type &&
      !TIPOS_PERMITIDOS.has(
        ficheiro.type
      )
    ) {
      return Response.json(
        {
          error:
            "O tipo de ficheiro não é suportado.",
        },
        { status: 400 }
      );
    }

    const nomeOriginal =
      ficheiro.name;

    const nomeLimpo =
      nomeSeguro(nomeOriginal);

    const nomeUnico =
      `${crypto.randomUUID()}-${nomeLimpo}`;

    const storagePath =
      `${membro.company_id}/${nomeUnico}`;

    const conteudo =
      await ficheiro.arrayBuffer();

    const { error: uploadError } =
      await supabase.storage
        .from(BUCKET)
        .upload(
          storagePath,
          conteudo,
          {
            contentType:
              ficheiro.type ||
              "application/octet-stream",
            upsert: false,
          }
        );

    if (uploadError) {
      console.error(
        "Erro ao fazer upload:",
        uploadError
      );

      return Response.json(
        {
          error:
            "Não foi possível guardar o ficheiro.",
        },
        { status: 500 }
      );
    }

    const {
      data: documento,
      error: documentoError,
    } = await supabase
      .from("company_documents")
      .insert({
        company_id:
          membro.company_id,
        user_id: user.id,
        file_name:
          nomeOriginal,
        storage_path:
          storagePath,
        mime_type:
          ficheiro.type ||
          "application/octet-stream",
        file_size:
          ficheiro.size,
      })
      .select()
      .single();

    if (documentoError) {
      console.error(
        "Erro ao registar documento:",
        documentoError
      );

      await supabase.storage
        .from(BUCKET)
        .remove([storagePath]);

      return Response.json(
        {
          error:
            "O ficheiro foi carregado, mas não foi possível registar o documento.",
        },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      message:
        "Documento carregado com sucesso.",
      documento,
    });
  } catch (error) {
    console.error(
      "Erro ao carregar documento:",
      error
    );

    return Response.json(
      {
        error:
          "Ocorreu um erro ao carregar o documento.",
      },
      { status: 500 }
    );
  }
}

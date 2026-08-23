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

export async function GET() {
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
      return Response.json(
        {
          error:
            "A sua conta não está associada a nenhuma empresa.",
        },
        { status: 403 }
      );
    }

    const {
      data: documentos,
      error: documentosError,
    } = await supabase
      .from("company_documents")
      .select(
        "id, file_name, mime_type, file_size, created_at, extracted_text"
      )
      .eq(
        "company_id",
        membro.company_id
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      );

    if (documentosError) {
      console.error(
        "Erro ao obter documentos:",
        documentosError
      );

      return Response.json(
        {
          error:
            "Não foi possível obter os documentos.",
        },
        { status: 500 }
      );
    }

    const documentosFormatados =
      (documentos || []).map(
        (documento) => ({
          id: documento.id,
          file_name:
            documento.file_name,
          mime_type:
            documento.mime_type,
          file_size:
            documento.file_size,
          created_at:
            documento.created_at,
          processado:
            Boolean(
              documento.extracted_text?.trim()
            ),
        })
      );

    return Response.json({
      documentos:
        documentosFormatados,
    });
  } catch (error) {
    console.error(
      "Erro ao listar documentos:",
      error
    );

    return Response.json(
      {
        error:
          "Ocorreu um erro ao obter os documentos.",
      },
      { status: 500 }
    );
  }
}
export async function DELETE(request: Request) {
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
      return Response.json(
        {
          error:
            "A sua conta não está associada a nenhuma empresa.",
        },
        { status: 403 }
      );
    }

    const body =
      await request.json();

    const documentId =
      body?.documentId;

    if (
      typeof documentId !==
        "string" ||
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

    // Procurar apenas documentos da empresa
    const {
      data: documento,
      error: documentoError,
    } = await supabase
      .from("company_documents")
      .select(
        "id, company_id, storage_path, file_name"
      )
      .eq(
        "id",
        documentId
      )
      .eq(
        "company_id",
        membro.company_id
      )
      .single();

    if (
      documentoError ||
      !documento
    ) {
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

    // Remover ficheiro do Storage
    const {
      error: storageError,
    } = await supabase.storage
      .from("company-documents")
      .remove([
        documento.storage_path,
      ]);

    if (storageError) {
      console.error(
        "Erro ao remover ficheiro:",
        storageError
      );

      return Response.json(
        {
          error:
            "Não foi possível remover o ficheiro do Storage.",
        },
        { status: 500 }
      );
    }

    // Remover registo da base de dados
    const {
      error: deleteError,
    } = await supabase
      .from("company_documents")
      .delete()
      .eq(
        "id",
        documento.id
      )
      .eq(
        "company_id",
        membro.company_id
      );

    if (deleteError) {
      console.error(
        "Erro ao remover documento:",
        deleteError
      );

      return Response.json(
        {
          error:
            "O ficheiro foi removido, mas não foi possível remover o registo.",
        },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      message:
        "Documento eliminado com sucesso.",
    });
  } catch (error) {
    console.error(
      "Erro ao eliminar documento:",
      error
    );

    return Response.json(
      {
        error:
          "Ocorreu um erro ao eliminar o documento.",
      },
      { status: 500 }
    );
  }
}
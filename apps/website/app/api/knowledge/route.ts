import { createSupabaseServerClient } from "@/lib/supabase-server";

type Conhecimento = {
  descricao: string;
  servicos: string;
  produtos: string;
  informacoes: string;
};

async function obterEmpresaDoUtilizador() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      supabase,
      user: null,
      companyId: null,
      error: "É necessário iniciar sessão.",
      status: 401,
    };
  }

  const { data: membro, error: membroError } = await supabase
    .from("company_members")
    .select("company_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (membroError || !membro) {
    console.error(
      "Erro ao encontrar associação:",
      membroError
    );

    return {
      supabase,
      user,
      companyId: null,
      error:
        "A sua conta não está associada a nenhuma empresa.",
      status: 403,
    };
  }

  return {
    supabase,
    user,
    companyId: membro.company_id,
    error: null,
    status: 200,
  };
}

export async function GET() {
  try {
    const {
      supabase,
      companyId,
      error,
      status,
    } = await obterEmpresaDoUtilizador();

    if (!companyId) {
      return Response.json(
        { error },
        { status }
      );
    }

    const { data, error: conhecimentoError } =  await supabase
       .from("company_knowledge")
       .select("*")
       .eq("company_id", companyId)
       .order("created_at", {
           ascending: false,
         })
       .limit(1)
        .maybeSingle();

    if (conhecimentoError) {
      console.error(
        "Erro ao obter conhecimento:",
        conhecimentoError
      );

      return Response.json(
        {
          error:
            "Não foi possível obter o conhecimento.",
        },
        { status: 500 }
      );
    }

    return Response.json({
      conhecimento: data,
    });
  } catch (error) {
    console.error(
      "Erro ao obter conhecimento:",
      error
    );

    return Response.json(
      {
        error:
          "Ocorreu um erro ao obter o conhecimento.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const {
      supabase,
      companyId,
      error,
      status,
    } = await obterEmpresaDoUtilizador();

    if (!companyId) {
      return Response.json(
        { error },
        { status }
      );
    }

    const dados: Conhecimento =
      await request.json();

    const descricao =
      dados.descricao?.trim() || "";

    const servicos =
      dados.servicos?.trim() || "";

    const produtos =
      dados.produtos?.trim() || "";

    const informacoes =
      dados.informacoes?.trim() || "";

    // Obter o nome oficial da empresa
    const {
      data: empresa,
      error: empresaError,
    } = await supabase
      .from("companies")
      .select("name")
      .eq("id", companyId)
      .single();

    if (empresaError || !empresa) {
      console.error(
        "Erro ao obter empresa:",
        empresaError
      );

      return Response.json(
        {
          error:
            "Não foi possível identificar a empresa.",
        },
        { status: 500 }
      );
    }

    // Verificar se já existe conhecimento
    const {
      data: conhecimentoExistente,
      error: conhecimentoError,
    } = await supabase
      .from("company_knowledge")
      .select("id")
      .eq("company_id", companyId)
      .limit(1)
      .maybeSingle();

    if (conhecimentoError) {
      console.error(
        "Erro ao verificar conhecimento:",
        conhecimentoError
      );

      return Response.json(
        {
          error:
            "Não foi possível verificar o conhecimento existente.",
        },
        { status: 500 }
      );
    }

    let data;
    let saveError;

    if (conhecimentoExistente) {
      // Atualizar conhecimento existente
      const resultado = await supabase
    .from("company_knowledge")
    .update({
      empresa: empresa.name,
      descricao,
      servicos,
      produtos,
      informacoes,
    })
    .eq("id", conhecimentoExistente.id)
    .eq("company_id", companyId)
    .select("*");

    data = resultado.data?.[0] ?? null;
    saveError = resultado.error;
    } else {
      // Criar conhecimento pela primeira vez
      const resultado = await supabase
        .from("company_knowledge")
        .insert({
          company_id: companyId,
          empresa: empresa.name,
          descricao,
          servicos,
          produtos,
          informacoes,
        })
        .select()
        .single();

      data = resultado.data;
      saveError = resultado.error;
    }

   if (saveError) {
  console.error(
    "Erro ao guardar conhecimento:",
    saveError
  );

  return Response.json(
    {
      error:
        "Não foi possível guardar o conhecimento.",
    },
    { status: 500 }
  );
}

    return Response.json({
      success: true,
      message:
        "Conhecimento guardado com sucesso.",
      data,
    });
  } catch (error) {
    console.error(
      "Erro ao guardar conhecimento:",
      error
    );

    return Response.json(
      {
        error:
          "Ocorreu um erro ao processar o conhecimento.",
      },
      { status: 500 }
    );
  }
}
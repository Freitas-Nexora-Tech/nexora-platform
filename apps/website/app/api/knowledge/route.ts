import { createSupabaseServerClient } from "@/lib/supabase-server";

type Conhecimento = {
  empresa: string;
  descricao: string;
  servicos: string;
  produtos: string;
  informacoes: string;
};

export async function POST(request: Request) {
  try {
    const supabase =
      await createSupabaseServerClient();

    // Verificar utilizador autenticado
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
        {
          status: 401,
        }
      );
    }

    // Encontrar a empresa associada ao utilizador
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
        "Erro ao encontrar associação:",
        membroError
      );

      return Response.json(
        {
          error:
            "A sua conta não está associada a nenhuma empresa.",
        },
        {
          status: 403,
        }
      );
    }

    const dados: Conhecimento =
      await request.json();

    if (!dados.empresa?.trim()) {
      return Response.json(
        {
          error:
            "O nome da empresa é obrigatório.",
        },
        {
          status: 400,
        }
      );
    }

    // Guardar conhecimento associado à empresa correta
    const { data, error } = await supabase
      .from("company_knowledge")
      .insert({
        company_id: membro.company_id,
        empresa: dados.empresa.trim(),
        descricao: dados.descricao || "",
        servicos: dados.servicos || "",
        produtos: dados.produtos || "",
        informacoes: dados.informacoes || "",
      })
      .select()
      .single();

    if (error) {
      console.error(
        "Erro do Supabase:",
        error
      );

      return Response.json(
        {
          error:
            "Não foi possível guardar o conhecimento.",
        },
        {
          status: 500,
        }
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
      {
        status: 500,
      }
    );
  }
}

export async function GET() {
  try {
    const supabase =
      await createSupabaseServerClient();

    // Verificar utilizador autenticado
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
        {
          status: 401,
        }
      );
    }

    // Encontrar a empresa do utilizador
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
        {
          status: 403,
        }
      );
    }

    // Obter apenas o conhecimento da empresa do utilizador
    const { data, error } = await supabase
      .from("company_knowledge")
      .select("*")
      .eq("company_id", membro.company_id)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Erro do Supabase:",
        error
      );

      return Response.json(
        {
          error:
            "Não foi possível obter o conhecimento.",
        },
        {
          status: 500,
        }
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
      {
        status: 500,
      }
    );
  }
}
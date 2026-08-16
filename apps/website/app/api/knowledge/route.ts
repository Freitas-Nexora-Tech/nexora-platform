import { supabase } from "@/lib/supabase";

type Conhecimento = {
  empresa: string;
  descricao: string;
  servicos: string;
  produtos: string;
  informacoes: string;
};

export async function POST(request: Request) {
  try {
    const dados: Conhecimento = await request.json();

    if (!dados.empresa?.trim()) {
      return Response.json(
        {
          error: "O nome da empresa é obrigatório.",
        },
        {
          status: 400,
        }
      );
    }

    const { data, error } = await supabase
      .from("company_knowledge")
      .insert({
        empresa: dados.empresa.trim(),
        descricao: dados.descricao || "",
        servicos: dados.servicos || "",
        produtos: dados.produtos || "",
        informacoes: dados.informacoes || "",
      })
      .select()
      .single();

    if (error) {
      console.error("Erro do Supabase:", error);

      return Response.json(
        {
          error: "Não foi possível guardar o conhecimento.",
        },
        {
          status: 500,
        }
      );
    }

    return Response.json({
      success: true,
      message: "Conhecimento guardado com sucesso.",
      data,
    });
  } catch (error) {
    console.error("Erro ao guardar conhecimento:", error);

    return Response.json(
      {
        error: "Ocorreu um erro ao processar o conhecimento.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("company_knowledge")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro do Supabase:", error);

      return Response.json(
        {
          error: "Não foi possível obter o conhecimento.",
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
    console.error("Erro ao obter conhecimento:", error);

    return Response.json(
      {
        error: "Ocorreu um erro ao obter o conhecimento.",
      },
      {
        status: 500,
      }
    );
  }
}
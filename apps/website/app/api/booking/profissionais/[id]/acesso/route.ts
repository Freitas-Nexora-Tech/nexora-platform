import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

const PERMISSOES_VALIDAS = [
  "agenda",
  "clientes",
  "marcacoes",
  "servicos",
  "profissionais",
  "disponibilidade",
  "bloqueios",
  "financeiro",
  "configuracoes",
  "equipa",
] as const;

type Permissao = (typeof PERMISSOES_VALIDAS)[number];

function permissoesValidas(permissoes: unknown): permissoes is string[] {
  if (!Array.isArray(permissoes)) {
    return false;
  }

  return permissoes.every(
    (permissao) =>
      typeof permissao === "string" &&
      PERMISSOES_VALIDAS.includes(permissao as Permissao),
  );
}

async function obterAdmin() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      error: NextResponse.json(
        { error: "Não autenticado." },
        { status: 401 },
      ),
    };
  }

  const { data: membro, error: membroError } = await supabase
    .from("company_members")
    .select(
      "id, company_id, role, username, is_active, must_change_password",
    )
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (membroError || !membro) {
    return {
      error: NextResponse.json(
        { error: "Não foi encontrada uma empresa associada ao utilizador." },
        { status: 403 },
      ),
    };
  }

  if (!membro.is_active) {
    return {
      error: NextResponse.json(
        { error: "O utilizador está inativo." },
        { status: 403 },
      ),
    };
  }

  if (membro.must_change_password) {
    return {
      error: NextResponse.json(
        { error: "É necessário alterar a palavra-passe primeiro." },
        { status: 403 },
      ),
    };
  }

  if (membro.role !== "admin") {
    return {
      error: NextResponse.json(
        { error: "Apenas o administrador da empresa pode gerir acessos." },
        { status: 403 },
      ),
    };
  }

  return {
    supabase,
    user,
    membro,
  };
}

export async function GET(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    const admin = await obterAdmin();

    if ("error" in admin) {
      return admin.error;
    }

    const { id: profissionalId } = await context.params;
    const supabaseAdmin = createSupabaseAdminClient();

    const { data: profissional, error: profissionalError } =
      await supabaseAdmin
        .from("profissionais")
        .select("id, empresa_id, nome")
        .eq("id", profissionalId)
        .eq("empresa_id", admin.membro.company_id)
        .maybeSingle();

    if (profissionalError) {
      console.error(
        "Erro ao procurar profissional:",
        profissionalError,
      );

      return NextResponse.json(
        { error: "Não foi possível procurar o profissional." },
        { status: 500 },
      );
    }

    if (!profissional) {
      return NextResponse.json(
        { error: "Profissional não encontrado." },
        { status: 404 },
      );
    }

    const { data: membro, error: membroError } = await supabaseAdmin
      .from("company_members")
      .select(
        "id, user_id, company_id, role, username, is_active, must_change_password, profissional_id",
      )
      .eq("company_id", admin.membro.company_id)
      .eq("profissional_id", profissionalId)
      .maybeSingle();

    if (membroError) {
      console.error(
        "Erro ao procurar acesso do profissional:",
        membroError,
      );

      return NextResponse.json(
        { error: "Não foi possível procurar o acesso do profissional." },
        { status: 500 },
      );
    }

    if (!membro) {
      return NextResponse.json({
        temAcesso: false,
        profissional,
      });
    }

    const { data: permissoes, error: permissoesError } =
      await supabaseAdmin
        .from("company_member_permissions")
        .select("permission")
        .eq("member_id", membro.id);

    if (permissoesError) {
      console.error(
        "Erro ao procurar permissões:",
        permissoesError,
      );

      return NextResponse.json(
        { error: "Não foi possível carregar as permissões." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      temAcesso: true,
      profissional,
      acesso: {
        id: membro.id,
        user_id: membro.user_id,
        role: membro.role,
        username: membro.username,
        is_active: membro.is_active,
        must_change_password: membro.must_change_password,
        profissional_id: membro.profissional_id,
        permissoes: (permissoes ?? []).map((item) => item.permission),
      },
    });
  } catch (error) {
    console.error("Erro no GET de acesso do profissional:", error);

    return NextResponse.json(
      { error: "Ocorreu um erro interno." },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    const admin = await obterAdmin();

    if ("error" in admin) {
      return admin.error;
    }

    const { id: profissionalId } = await context.params;

    const body = await request.json();

    const username =
      typeof body?.username === "string"
        ? body.username.trim().toLowerCase()
        : "";

    const password =
      typeof body?.password === "string" ? body.password : "";

    const permissoesRecebidas = body?.permissions;

    if (!username) {
      return NextResponse.json(
        { error: "O nome de utilizador é obrigatório." },
        { status: 400 },
      );
    }

    if (!password || password.length < 8) {
      return NextResponse.json(
        {
          error:
            "A palavra-passe inicial deve ter pelo menos 8 caracteres.",
        },
        { status: 400 },
      );
    }

    if (!Array.isArray(permissoesRecebidas)) {
      return NextResponse.json(
        { error: "É necessário indicar as permissões." },
        { status: 400 },
      );
    }

    if (!permissoesValidas(permissoesRecebidas)) {
      return NextResponse.json(
        { error: "Foi indicada uma permissão inválida." },
        { status: 400 },
      );
    }

    const permissoes = [
      ...new Set(permissoesRecebidas),
    ] as Permissao[];

    const supabaseAdmin = createSupabaseAdminClient();

    const { data: profissional, error: profissionalError } =
      await supabaseAdmin
        .from("profissionais")
        .select("id, empresa_id, nome")
        .eq("id", profissionalId)
        .eq("empresa_id", admin.membro.company_id)
        .maybeSingle();

    if (profissionalError) {
      console.error(
        "Erro ao procurar profissional:",
        profissionalError,
      );

      return NextResponse.json(
        { error: "Não foi possível procurar o profissional." },
        { status: 500 },
      );
    }

    if (!profissional) {
      return NextResponse.json(
        { error: "Profissional não encontrado." },
        { status: 404 },
      );
    }

    const { data: acessoExistente, error: acessoExistenteError } =
      await supabaseAdmin
        .from("company_members")
        .select("id, user_id, role, username, is_active")
        .eq("company_id", admin.membro.company_id)
        .eq("profissional_id", profissionalId)
        .maybeSingle();

    if (acessoExistenteError) {
      console.error(
        "Erro ao verificar acesso existente:",
        acessoExistenteError,
      );

      return NextResponse.json(
        { error: "Não foi possível verificar o acesso existente." },
        { status: 500 },
      );
    }

    if (acessoExistente) {
      return NextResponse.json(
        {
          error:
            "Este profissional já possui um acesso ao Booking.",
        },
        { status: 409 },
      );
    }

    const { data: usernameExistente, error: usernameError } =
      await supabaseAdmin
        .from("company_members")
        .select("id")
        .ilike("username", username)
        .limit(1)
        .maybeSingle();

    if (usernameError) {
      console.error(
        "Erro ao verificar nome de utilizador:",
        usernameError,
      );

      return NextResponse.json(
        {
          error:
            "Não foi possível verificar o nome de utilizador.",
        },
        { status: 500 },
      );
    }

    if (usernameExistente) {
      return NextResponse.json(
        {
          error:
            "Este nome de utilizador já está a ser utilizado.",
        },
        { status: 409 },
      );
    }

    const emailInterno = `${username}@auth.nexora.local`;

    const { data: novoUtilizador, error: criarUtilizadorError } =
      await supabaseAdmin.auth.admin.createUser({
        email: emailInterno,
        password,
        email_confirm: true,
        user_metadata: {
          username,
          company_id: admin.membro.company_id,
          profissional_id: profissionalId,
        },
      });

    if (criarUtilizadorError || !novoUtilizador.user) {
      console.error(
        "Erro ao criar utilizador Auth:",
        criarUtilizadorError,
      );

      return NextResponse.json(
        {
          error:
            criarUtilizadorError?.message ||
            "Não foi possível criar o acesso.",
        },
        { status: 400 },
      );
    }

    const userId = novoUtilizador.user.id;

    const { data: novoMembro, error: criarMembroError } =
      await supabaseAdmin
        .from("company_members")
        .insert({
          user_id: userId,
          company_id: admin.membro.company_id,
          role: "employee",
          username,
          is_active: true,
          must_change_password: true,
          profissional_id: profissionalId,
        })
        .select(
          "id, user_id, company_id, role, username, is_active, must_change_password, profissional_id",
        )
        .single();

    if (criarMembroError || !novoMembro) {
      console.error(
        "Erro ao criar company_member:",
        criarMembroError,
      );

      await supabaseAdmin.auth.admin.deleteUser(userId);

      return NextResponse.json(
        {
          error:
            criarMembroError?.message ||
            "Não foi possível criar o membro da equipa.",
        },
        { status: 400 },
      );
    }

    if (permissoes.length > 0) {
      const rows = permissoes.map((permission) => ({
        member_id: novoMembro.id,
        permission,
      }));

      const { error: permissoesError } = await supabaseAdmin
        .from("company_member_permissions")
        .insert(rows);

      if (permissoesError) {
        console.error(
          "Erro ao criar permissões:",
          permissoesError,
        );

        await supabaseAdmin
          .from("company_members")
          .delete()
          .eq("id", novoMembro.id);

        await supabaseAdmin.auth.admin.deleteUser(userId);

        return NextResponse.json(
          {
            error:
              "Não foi possível criar as permissões do utilizador.",
          },
          { status: 400 },
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        acesso: {
          ...novoMembro,
          permissoes,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Erro no POST de acesso do profissional:", error);

    return NextResponse.json(
      { error: "Ocorreu um erro interno ao criar o acesso." },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    const admin = await obterAdmin();

    if ("error" in admin) {
      return admin.error;
    }

    const { id: profissionalId } = await context.params;
    const body = await request.json();

    const temIsActive =
      typeof body?.is_active === "boolean";

    const temPermissoes =
      Array.isArray(body?.permissions);

    if (!temIsActive && !temPermissoes) {
      return NextResponse.json(
        {
          error:
            "Não foi indicada nenhuma alteração.",
        },
        { status: 400 },
      );
    }

    if (
      temPermissoes &&
      !permissoesValidas(body.permissions)
    ) {
      return NextResponse.json(
        {
          error:
            "Foi indicada uma permissão inválida.",
        },
        { status: 400 },
      );
    }

    const permissoes = temPermissoes
      ? ([...new Set(body.permissions)] as Permissao[])
      : null;

    const supabaseAdmin = createSupabaseAdminClient();

    const { data: profissional, error: profissionalError } =
      await supabaseAdmin
        .from("profissionais")
        .select("id, empresa_id, nome")
        .eq("id", profissionalId)
        .eq("empresa_id", admin.membro.company_id)
        .maybeSingle();

    if (profissionalError) {
      console.error(
        "Erro ao procurar profissional:",
        profissionalError,
      );

      return NextResponse.json(
        {
          error:
            "Não foi possível procurar o profissional.",
        },
        { status: 500 },
      );
    }

    if (!profissional) {
      return NextResponse.json(
        { error: "Profissional não encontrado." },
        { status: 404 },
      );
    }

    const { data: membro, error: membroError } =
      await supabaseAdmin
        .from("company_members")
        .select(
          "id, user_id, company_id, role, username, is_active, must_change_password, profissional_id",
        )
        .eq("company_id", admin.membro.company_id)
        .eq("profissional_id", profissionalId)
        .maybeSingle();

    if (membroError) {
      console.error(
        "Erro ao procurar acesso:",
        membroError,
      );

      return NextResponse.json(
        {
          error:
            "Não foi possível procurar o acesso do profissional.",
        },
        { status: 500 },
      );
    }

    if (!membro) {
      return NextResponse.json(
        {
          error:
            "Este profissional ainda não possui acesso ao Booking.",
        },
        { status: 404 },
      );
    }

    if (membro.role === "admin") {
      return NextResponse.json(
        {
          error:
            "O acesso de administrador não pode ser alterado através desta gestão.",
        },
        { status: 403 },
      );
    }

    if (temPermissoes) {
      const { error: apagarPermissoesError } =
        await supabaseAdmin
          .from("company_member_permissions")
          .delete()
          .eq("member_id", membro.id);

      if (apagarPermissoesError) {
        console.error(
          "Erro ao remover permissões antigas:",
          apagarPermissoesError,
        );

        return NextResponse.json(
          {
            error:
              "Não foi possível atualizar as permissões.",
          },
          { status: 400 },
        );
      }

      if (permissoes && permissoes.length > 0) {
        const rows = permissoes.map((permission) => ({
          member_id: membro.id,
          permission,
        }));

        const { error: inserirPermissoesError } =
          await supabaseAdmin
            .from("company_member_permissions")
            .insert(rows);

        if (inserirPermissoesError) {
          console.error(
            "Erro ao inserir novas permissões:",
            inserirPermissoesError,
          );

          return NextResponse.json(
            {
              error:
                "As permissões antigas foram removidas, mas não foi possível guardar as novas.",
            },
            { status: 400 },
          );
        }
      }
    }

    if (temIsActive) {
      const { error: atualizarMembroError } =
        await supabaseAdmin
          .from("company_members")
          .update({
            is_active: body.is_active,
          })
          .eq("id", membro.id)
          .eq("company_id", admin.membro.company_id);

      if (atualizarMembroError) {
        console.error(
          "Erro ao atualizar estado do acesso:",
          atualizarMembroError,
        );

        return NextResponse.json(
          {
            error:
              "As permissões foram atualizadas, mas não foi possível atualizar o estado do acesso.",
          },
          { status: 400 },
        );
      }
    }

    const { data: membroAtualizado, error: membroAtualizadoError } =
      await supabaseAdmin
        .from("company_members")
        .select(
          "id, user_id, company_id, role, username, is_active, must_change_password, profissional_id",
        )
        .eq("id", membro.id)
        .single();

    if (membroAtualizadoError || !membroAtualizado) {
      return NextResponse.json(
        {
          error:
            "A alteração foi efetuada, mas não foi possível carregar o resultado.",
        },
        { status: 500 },
      );
    }

    const { data: permissoesAtuais, error: permissoesAtuaisError } =
      await supabaseAdmin
        .from("company_member_permissions")
        .select("permission")
        .eq("member_id", membro.id);

    if (permissoesAtuaisError) {
      return NextResponse.json(
        {
          error:
            "A alteração foi efetuada, mas não foi possível carregar as permissões atuais.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      acesso: {
        ...membroAtualizado,
        permissoes: (permissoesAtuais ?? []).map(
          (item) => item.permission,
        ),
      },
    });
  } catch (error) {
    console.error(
      "Erro no PATCH de acesso do profissional:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Ocorreu um erro interno ao atualizar o acesso.",
      },
      { status: 500 },
    );
  }
}
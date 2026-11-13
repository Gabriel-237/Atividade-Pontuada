const express = require("express");
const cookieParser = require("cookie-parser");
const path = require("path");
const { OAuth2Client } = require("google-auth-library");

const app = express();
const PORT = process.env.PORT || 3000;
const CLIENT_ID = "49075361343-d922b67g7imulaidv7gouhtu792tf62t.apps.googleusercontent.com";

const client = new OAuth2Client(CLIENT_ID);

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname)));

// Garante que a página inicial carregue corretamente na Vercel
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Rota que valida o ID Token no servidor
app.post("/api/auth/google", async (req, res) => {
  const { id_token } = req.body;

  if (!id_token) {
    return res.status(400).json({ erro: "Token não enviado." });
  }

  try {
    // Verifica assinatura, emissor, expiração e audiência
    const ticket = await client.verifyIdToken({
      idToken: id_token,
      audience: CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload.email_verified) {
      return res.status(403).json({ erro: "E-mail não verificado pelo Google." });
    }

    const usuario = {
      sub: payload.sub,
      nome: payload.name,
      email: payload.email,
      foto: payload.picture,
    };

    // Cria cookie de sessão seguro (HttpOnly)
    res.cookie("sessao_usuario", JSON.stringify(usuario), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 horas
    });

    return res.json({ usuario });
  } catch (error) {
    console.error("Erro na validação do token:", error);
    return res.status(401).json({ erro: "Token inválido ou expirado." });
  }
});

// Rota para verificar se o usuário já está logado ao recarregar a página
app.get("/api/me", (req, res) => {
  const cookie = req.cookies.sessao_usuario;
  if (!cookie) {
    return res.status(401).json({ erro: "Não autenticado." });
  }

  try {
    const usuario = JSON.parse(cookie);
    return res.json({ usuario });
  } catch {
    return res.status(401).json({ erro: "Sessão inválida." });
  }
});

// Rota para encerrar a sessão
app.post("/api/logout", (req, res) => {
  res.clearCookie("sessao_usuario");
  return res.json({ mensagem: "Logout realizado com sucesso." });
});

// Inicia o servidor localmente (quando não estiver rodando na Vercel)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
}

// Exporta o app para a Vercel
module.exports = app;
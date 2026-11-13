const express = require("express");
const cookieParser = require("cookie-parser");
const { OAuth2Client } = require("google-auth-library");

const app = express();
const PORT = 3000;
const CLIENT_ID = "49075361343-d922b67g7imulaidv7gouhtu792tf62t.apps.googleusercontent.com";

const client = new OAuth2Client(CLIENT_ID);

app.use(express.json());
app.use(cookieParser());
// Serve os arquivos HTML, CSS e JS da mesma pasta (evita problemas de CORS)
app.use(express.static(__dirname));

// Rota que valida o ID Token no servidor[cite: 4, 5]
app.post("/api/auth/google", async (req, res) => {
  const { id_token } = req.body;

  if (!id_token) {
    return res.status(400).json({ erro: "Token não enviado." });
  }

  try {
    // Verifica assinatura, emissor, expiração e audiência[cite: 4, 5]
    const ticket = await client.verifyIdToken({
      idToken: id_token,
      audience: CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload.email_verified) {
      return res.status(403).json({ erro: "E-mail não verificado pelo Google." });
    }

    // Usa o campo 'sub' como identificador imutável (nunca o e-mail)[cite: 5, 6]
    const usuario = {
      googleUserId: payload.sub,
      nome: payload.name,
      email: payload.email,
      foto: payload.picture,
    };

    // Cria um cookie de sessão seguro (HttpOnly e SameSite)[cite: 5, 7]
    res.cookie("sessao_usuario", usuario.googleUserId, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 3600000 // 1 hora
    });

    res.json({ mensagem: "Login válido!", usuario });
  } catch (error) {
    res.status(401).json({ erro: "Token inválido ou expirado." });
  }
});

// Rota de Logout que invalida o cookie de sessão[cite: 7]
app.post("/api/logout", (req, res) => {
  res.clearCookie("sessao_usuario");
  res.json({ mensagem: "Logout realizado." });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
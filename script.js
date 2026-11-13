const CLIENT_ID = "49075361343-d922b67g7imulaidv7gouhtu792tf62t.apps.googleusercontent.com";

const loginBox = document.getElementById("login-box");
const perfilBox = document.getElementById("perfil-box");
const statusMsg = document.getElementById("status-msg");

// Inicializa o botão do Google assim que a página carregar[cite: 4]
window.onload = () => {
  google.accounts.id.initialize({
    client_id: CLIENT_ID,
    callback: handleCredentialResponse
  });

  google.accounts.id.renderButton(
    document.getElementById("botao-google"),
    { theme: "outline", size: "large" }
  );
};

// Envia o ID Token para o servidor validar (nunca confia apenas no navegador)[cite: 4, 5]
async function handleCredentialResponse(response) {
  statusMsg.textContent = "Validando token no servidor...";

  try {
    const res = await fetch("/api/auth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_token: response.credential })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.erro || "Falha na autenticação");
    }

    // Exibe os dados validados retornados pelo backend
    document.getElementById("user-foto").src = data.usuario.foto;
    document.getElementById("user-nome").textContent = data.usuario.nome;
    document.getElementById("user-email").textContent = data.usuario.email;
    document.getElementById("user-sub").textContent = `ID Único (sub): ${data.usuario.googleUserId}`;

    loginBox.classList.add("oculto");
    perfilBox.classList.remove("oculto");
    statusMsg.textContent = "";
  } catch (error) {
    statusMsg.textContent = "Erro: " + error.message;
  }
}

// Encerra a sessão no servidor e desativa o login automático do GIS[cite: 7]
document.getElementById("btn-logout").addEventListener("click", async () => {
  await fetch("/api/logout", { method: "POST" });
  
  if (window.google) {
    google.accounts.id.disableAutoSelect();
  }

  perfilBox.classList.add("oculto");
  loginBox.classList.remove("oculto");
  statusMsg.textContent = "Sessão encerrada com segurança.";
});
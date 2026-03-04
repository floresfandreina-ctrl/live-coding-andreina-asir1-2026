const API = "http://localhost:3000";

let token = localStorage.getItem("token") || "";

const msgEl = document.getElementById("msg");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

const goRegister = document.getElementById("goRegister");
const goLogin = document.getElementById("goLogin");

const appArea = document.getElementById("appArea");
const notaForm = document.getElementById("notaForm");
const refreshBtn = document.getElementById("refreshBtn");
const notesList = document.getElementById("notesList");
const notesCount = document.getElementById("notesCount");
const logoutBtn = document.getElementById("logoutBtn");

function showMsg(text, type = "ok") {
  msgEl.textContent = text;
  msgEl.className = `msg show ${type}`;
}

function clearMsg() {
  msgEl.textContent = "";
  msgEl.className = "msg";
}

function showLogin() {
  clearMsg();
  loginForm.classList.remove("hidden");
  registerForm.classList.add("hidden");
}

function showRegister() {
  clearMsg();
  registerForm.classList.remove("hidden");
  loginForm.classList.add("hidden");
}

function showApp() {
  clearMsg();
  appArea.classList.remove("hidden");
  loginForm.classList.add("hidden");
  registerForm.classList.add("hidden");
}

function showAuth() {
  appArea.classList.add("hidden");
  showLogin();
}

async function apiFetch(path, options = {}) {
  const headers = { ...(options.headers || {}) };

  // Si mandamos body JSON, ponemos content-type
  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

// ----- Switch Login/Register -----
goRegister.addEventListener("click", (e) => {
  e.preventDefault();
  showRegister();
});

goLogin.addEventListener("click", (e) => {
  e.preventDefault();
  showLogin();
});

// ----- Auth -----
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearMsg();

  const payload = Object.fromEntries(new FormData(loginForm).entries());

  const { res, data } = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    return showMsg(data.error || "Error al iniciar sesión", "err");
  }

  token = data.token;
  localStorage.setItem("token", token);
  showMsg("Login correcto ✅", "ok");
  showApp();
  await refrescarNotas();
});

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearMsg();

  const payload = Object.fromEntries(new FormData(registerForm).entries());

  const { res, data } = await apiFetch("/auth/registro", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    return showMsg(data.error || "Error al registrarse", "err");
  }

  showMsg("Cuenta creada ✅ Ahora inicia sesión.", "ok");
  registerForm.reset();
  showLogin();
});

logoutBtn.addEventListener("click", () => {
  token = "";
  localStorage.removeItem("token");
  notesList.innerHTML = "";
  notesCount.textContent = "";
  showMsg("Sesión cerrada.", "ok");
  showAuth();
});

// ----- Notas -----
notaForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearMsg();

  const payload = Object.fromEntries(new FormData(notaForm).entries());

  const { res, data } = await apiFetch("/notas", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    // Si token expiró o falta token
    if (res.status === 401) {
      token = "";
      localStorage.removeItem("token");
      showMsg("Tu sesión ha expirado. Vuelve a iniciar sesión.", "err");
      return showAuth();
    }
    return showMsg(data.error || "Error creando la nota", "err");
  }

  notaForm.reset();
  showMsg("Nota creada ✅", "ok");
  await refrescarNotas();
});

refreshBtn.addEventListener("click", refrescarNotas);

async function refrescarNotas() {
  notesList.innerHTML = "";
  notesCount.textContent = "";

  const { res, data } = await apiFetch("/notas");

  if (!res.ok) {
    if (res.status === 401) {
      token = "";
      localStorage.removeItem("token");
      showMsg("No autorizado. Inicia sesión.", "err");
      return showAuth();
    }
    return showMsg(data.error || "Error cargando notas", "err");
  }

  const notas = data.notas || [];
  notesCount.textContent = `${notas.length} nota(s)`;

  for (const n of notas) {
    const li = document.createElement("li");

    const title = document.createElement("div");
    title.className = "note-title";
    // Anti-XSS: textContent, nunca innerHTML con datos del usuario
    title.textContent = n.titulo;

    const meta = document.createElement("div");
    meta.className = "note-meta";
    meta.textContent = `Creada: ${n.creado_en}${n.actualizado_en ? ` · Actualizada: ${n.actualizado_en}` : ""}`;

    li.appendChild(title);
    li.appendChild(meta);
    notesList.appendChild(li);
  }
}

// ----- Auto-login si hay token guardado -----
(async function init() {
  if (token) {
    // Intento de cargar notas para validar token
    showApp();
    const { res } = await apiFetch("/notas");
    if (!res.ok) {
      token = "";
      localStorage.removeItem("token");
      showAuth();
    } else {
      await refrescarNotas();
    }
  } else {
    showAuth();
  }
})();


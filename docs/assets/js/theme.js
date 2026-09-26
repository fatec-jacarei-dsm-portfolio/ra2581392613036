import { ehTouch, reduzirMovimento, state } from "./core.js";

const raiz = document.documentElement;
const themeToggle = document.getElementById("themeToggle");
const metaThemeColor = document.querySelector('meta[name="theme-color"]');

function temaAtual() {
  return raiz.dataset.theme === "light" ? "light" : "dark";
}

function salvarTema(tema) {
  try {
    localStorage.setItem("tema", tema);
  } catch {
    return;
  }
}

function atualizarAcessibilidade() {
  if (!themeToggle) return;
  const claroAtivo = temaAtual() === "light";
  const chave = claroAtivo ? "aria.temaEscuro" : "aria.temaClaro";
  const fallback = claroAtivo ? "Ativar modo escuro" : "Ativar modo claro";

  themeToggle.classList.toggle("is-light", claroAtivo);
  themeToggle.setAttribute("aria-checked", String(claroAtivo));
  themeToggle.setAttribute("aria-label", state.traducoes[chave] || fallback);
}

function aplicarTema(tema, persistir = true) {
  const temaNormalizado = tema === "light" ? "light" : "dark";
  raiz.dataset.theme = temaNormalizado;
  metaThemeColor?.setAttribute(
    "content",
    temaNormalizado === "light" ? "#eeeae4" : "#000000",
  );
  atualizarAcessibilidade();
  if (persistir) salvarTema(temaNormalizado);
  dispatchEvent(
    new CustomEvent("themechange", { detail: { theme: temaNormalizado } }),
  );
}

function trocarTema() {
  const proximoTema = temaAtual() === "dark" ? "light" : "dark";
  if (reduzirMovimento || !document.startViewTransition) {
    aplicarTema(proximoTema);
    return;
  }

  document.startViewTransition(() => aplicarTema(proximoTema));
}

function configurarVisibilidadeDoControle() {
  const palco = document.querySelector(".hero__album-stage");
  const capa = palco?.querySelector(".hero__cover");
  const controle = palco?.querySelector(".hero__theme-control");
  const botao = controle?.querySelector(".hero__theme-switch");
  if (!palco || !capa || !controle) return;

  let fechamentoPendente = 0;
  let ultimaPosicaoPonteiro = null;
  const abrir = () => {
    clearTimeout(fechamentoPendente);
    palco.classList.add("is-theme-control-visible");
  };
  const fechar = (atraso = 0) => {
    clearTimeout(fechamentoPendente);
    fechamentoPendente = setTimeout(() => {
      palco.classList.remove("is-theme-control-visible");
    }, atraso);
  };
  const pontoNoRetangulo = (x, y, rect, margem = 0) =>
    x >= rect.left - margem &&
    x <= rect.right + margem &&
    y >= rect.top - margem &&
    y <= rect.bottom + margem;
  const ponteiroNaAreaAtiva = ({ x, y }) => {
    const rectCapa = capa.getBoundingClientRect();
    const rectControle = controle.getBoundingClientRect();
    const noCorredor =
      x >= rectControle.right &&
      x <= rectCapa.left &&
      y >= rectControle.top - 4 &&
      y <= rectControle.bottom + 4;
    return (
      pontoNoRetangulo(x, y, rectCapa) ||
      pontoNoRetangulo(x, y, rectControle) ||
      noCorredor
    );
  };

  if (ehTouch) {
    capa.addEventListener("click", () => {
      palco.classList.toggle("is-theme-control-visible");
    });
    document.addEventListener("pointerdown", (evento) => {
      if (!palco.contains(evento.target)) fechar();
    });
    return;
  }

  capa.addEventListener("pointerenter", abrir);
  controle.addEventListener("pointerenter", abrir);
  document.addEventListener("pointermove", (evento) => {
    ultimaPosicaoPonteiro = { x: evento.clientX, y: evento.clientY };
    if (ponteiroNaAreaAtiva(ultimaPosicaoPonteiro)) {
      abrir();
      return;
    }
    botao?.blur();
    fechar(160);
  });
  document.documentElement.addEventListener("mouseleave", () => fechar(120));
  controle.addEventListener("focusin", abrir);
  controle.addEventListener("focusout", () => {
    if (
      !ultimaPosicaoPonteiro ||
      !ponteiroNaAreaAtiva(ultimaPosicaoPonteiro)
    ) {
      fechar(120);
    }
  });
}

export function prepararTema() {
  aplicarTema(temaAtual(), false);
  configurarVisibilidadeDoControle();
  themeToggle?.addEventListener("click", trocarTema);
  addEventListener("languagechange", atualizarAcessibilidade);
}

import { ehTouch, paginaVisivel, reduzirMovimento } from "./core.js";

function configurarCanvas(canvas, contexto) {
  const dpr = Math.min(devicePixelRatio || 1, 1.5);
  const largura = canvas.clientWidth || innerWidth;
  const altura = canvas.clientHeight || innerHeight;
  canvas.width = Math.round(largura * dpr);
  canvas.height = Math.round(altura * dpr);
  contexto.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { largura, altura };
}

function iniciarTickerStack() {
  const track = document.getElementById("stackTicker");
  const grupo = track?.querySelector(".ticker__group");
  if (
    !track ||
    !grupo ||
    reduzirMovimento ||
    ehTouch ||
    track.children.length > 1
  )
    return;
  const copia = grupo.cloneNode(true);
  copia.setAttribute("aria-hidden", "true");
  track.appendChild(copia);
  track.classList.add("is-running");
  track.closest(".ticker")?.classList.add("is-running");
}

function iniciarCursor() {
  const cursorCanvas = document.getElementById("cursorCanvas");
  if (!cursorCanvas || ehTouch || reduzirMovimento) return;
  const ctx = cursorCanvas.getContext("2d");
  if (!ctx) return;

  let rastro = [];
  let tamanho;
  let cursorX = 0;
  let cursorY = 0;
  let cursorAtivo = false;
  let cursorDentroDaPagina = false;
  let quadroPendente = false;
  document.documentElement.classList.add("has-custom-cursor");

  function limparCursor() {
    rastro = [];
    cursorAtivo = false;
    if (tamanho) ctx.clearRect(0, 0, tamanho.largura, tamanho.altura);
  }

  function configurar() {
    const estavaAtivo = cursorAtivo;
    tamanho = configurarCanvas(cursorCanvas, ctx);
    rastro = [];
    cursorAtivo = estavaAtivo;
  }

  function solicitarDesenho() {
    if (quadroPendente) return;
    quadroPendente = true;
    requestAnimationFrame(desenhar);
  }

  addEventListener(
    "pointermove",
    (evento) => {
      cursorX = evento.clientX;
      cursorY = evento.clientY;
      cursorAtivo = true;
      cursorDentroDaPagina = true;
      const ultimo = rastro.at(-1);
      if (
        !ultimo ||
        Math.hypot(evento.clientX - ultimo.x, evento.clientY - ultimo.y) > 4
      ) {
        rastro.push({ x: evento.clientX, y: evento.clientY, vida: 1 });
        if (rastro.length > 32) rastro.shift();
      } else {
        ultimo.x = evento.clientX;
        ultimo.y = evento.clientY;
        ultimo.vida = 1;
      }
      solicitarDesenho();
    },
    { passive: true },
  );
  document.documentElement.addEventListener("mouseleave", () => {
    cursorDentroDaPagina = false;
    limparCursor();
  });
  document.documentElement.addEventListener("mouseenter", (evento) => {
    cursorX = evento.clientX;
    cursorY = evento.clientY;
    cursorAtivo = true;
    cursorDentroDaPagina = true;
    solicitarDesenho();
  });
  addEventListener("blur", limparCursor);
  addEventListener("focus", () => {
    if (!cursorDentroDaPagina) return;
    cursorAtivo = true;
    solicitarDesenho();
  });

  function criarCaminhoDoRastro() {
    ctx.beginPath();
    ctx.moveTo(rastro[0].x, rastro[0].y);
    for (let indice = 1; indice < rastro.length - 1; indice += 1) {
      const atual = rastro[indice];
      const proximo = rastro[indice + 1];
      ctx.quadraticCurveTo(
        atual.x,
        atual.y,
        (atual.x + proximo.x) / 2,
        (atual.y + proximo.y) / 2,
      );
    }
    const ultimo = rastro.at(-1);
    ctx.lineTo(ultimo.x, ultimo.y);
  }

  function desenharRastro() {
    if (rastro.length < 2) return;
    const primeiro = rastro[0];
    const ultimo = rastro.at(-1);
    const atividade =
      rastro.reduce((soma, ponto) => soma + ponto.vida, 0) / rastro.length;
    const gradiente = ctx.createLinearGradient(
      primeiro.x,
      primeiro.y,
      ultimo.x,
      ultimo.y,
    );
    gradiente.addColorStop(0, "rgba(255,255,255,0)");
    gradiente.addColorStop(0.35, `rgba(255,255,255,${atividade * 0.16})`);
    gradiente.addColorStop(1, `rgba(255,255,255,${atividade * 0.62})`);

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    criarCaminhoDoRastro();
    ctx.strokeStyle = gradiente;
    ctx.lineWidth = 5;
    ctx.shadowColor = "rgba(255,255,255,.2)";
    ctx.shadowBlur = 9;
    ctx.stroke();
    criarCaminhoDoRastro();
    ctx.lineWidth = 1.15;
    ctx.shadowBlur = 0;
    ctx.stroke();
    ctx.restore();
  }

  function desenharCursor() {
    if (!cursorAtivo) return;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cursorX, cursorY, 2, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(238, 233, 229, 0.92)";
    ctx.shadowColor = "rgba(184, 50, 66, 0.5)";
    ctx.shadowBlur = 5;
    ctx.fill();
    ctx.restore();
  }

  function desenhar() {
    quadroPendente = false;
    ctx.clearRect(0, 0, tamanho.largura, tamanho.altura);
    if (!paginaVisivel) {
      rastro = [];
      return;
    }
    desenharRastro();
    desenharCursor();
    rastro.forEach((ponto) => {
      ponto.vida -= 0.026;
    });
    rastro = rastro.filter((ponto) => ponto.vida > 0);
    if (rastro.length) solicitarDesenho();
  }

  addEventListener(
    "resize",
    () => {
      configurar();
      solicitarDesenho();
    },
    { passive: true },
  );
  configurar();
}

export function prepararEfeitos() {
  iniciarTickerStack();
}

export function iniciarEfeitosInterativos() {
  iniciarCursor();
}

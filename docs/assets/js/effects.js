import { ehTouch, limitar, paginaVisivel, reduzirMovimento } from "./core.js";

function configurarCanvas(canvas, contexto) {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const largura = canvas.clientWidth || innerWidth;
  const altura = canvas.clientHeight || innerHeight;
  canvas.width = Math.round(largura * dpr);
  canvas.height = Math.round(altura * dpr);
  contexto.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { largura, altura };
}

function iniciarGalaxia() {
  const canvas = document.getElementById("galaxyCanvas");
  const finale = document.getElementById("finale");
  const gatilho = document.getElementById("galaxyReveal");
  const ctx = canvas?.getContext("2d");
  if (!canvas || !ctx || !finale || !gatilho) return;

  let estrelas = [];
  let tamanho;
  let parallax = 0;

  function redimensionar() {
    tamanho = configurarCanvas(canvas, ctx);
    const total = Math.min(
      360,
      Math.max(70, Math.floor((tamanho.largura * tamanho.altura) / 7200)),
    );
    estrelas = Array.from({ length: total }, (_, indice) => ({
      x: Math.random() * tamanho.largura,
      y: Math.random() * tamanho.altura,
      raio: indice % 7 ? Math.random() * 0.9 + 0.25 : Math.random() * 1.6 + 0.7,
      fase: Math.random() * Math.PI * 2,
      velocidade: Math.random() * 0.01 + 0.003,
      vermelha: Math.random() > 0.91,
      fator: Math.random() * 0.7 + 0.2,
    }));
  }

  function desenhar() {
    if (!paginaVisivel) {
      requestAnimationFrame(desenhar);
      return;
    }

    const rect = gatilho.getBoundingClientRect();
    const progresso = limitar((innerHeight - rect.top) / innerHeight);
    finale.style.clipPath = `inset(${((1 - progresso) * 100).toFixed(2)}% 0 0 0)`;
    if (!progresso) {
      setTimeout(() => requestAnimationFrame(desenhar), 180);
      return;
    }

    parallax += (-rect.top * 0.07 - parallax) * 0.055;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, tamanho.largura, tamanho.altura);
    estrelas.forEach((estrela) => {
      if (!reduzirMovimento) estrela.fase += estrela.velocidade;
      const brilho = reduzirMovimento
        ? 0.55
        : 0.25 + Math.abs(Math.sin(estrela.fase)) * 0.68;
      const y =
        (((estrela.y + parallax * estrela.fator) % tamanho.altura) +
          tamanho.altura) %
        tamanho.altura;
      ctx.beginPath();
      ctx.arc(estrela.x, y, estrela.raio, 0, Math.PI * 2);
      ctx.fillStyle = estrela.vermelha
        ? `rgba(201,51,63,${brilho})`
        : `rgba(237,231,226,${brilho})`;
      ctx.fill();
    });
    requestAnimationFrame(desenhar);
  }

  addEventListener("resize", redimensionar, { passive: true });
  redimensionar();
  desenhar();
}

function iniciarSoundwave() {
  const container = document.getElementById("soundwave");
  if (!container) return;

  function gerar() {
    container.replaceChildren();
    const quantidade = Math.min(
      120,
      Math.max(42, Math.floor((container.clientWidth || innerWidth) / 12)),
    );
    const fragmento = document.createDocumentFragment();
    for (let indice = 0; indice < quantidade; indice += 1) {
      const barra = document.createElement("span");
      const centro = Math.abs(indice - quantidade / 2) / (quantidade / 2);
      barra.style.setProperty(
        "--wave-height",
        `${(7 + (1 - centro) * 23 + Math.random() * 16).toFixed(1)}px`,
      );
      barra.style.setProperty(
        "--wave-duration",
        `${(0.7 + Math.random() * 0.9).toFixed(2)}s`,
      );
      barra.style.setProperty(
        "--wave-delay",
        `${(-Math.random() * 1.8).toFixed(2)}s`,
      );
      fragmento.appendChild(barra);
    }
    container.appendChild(fragmento);
  }

  let timer;
  addEventListener(
    "resize",
    () => {
      clearTimeout(timer);
      timer = setTimeout(gerar, 180);
    },
    { passive: true },
  );
  gerar();
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

function iniciarLinhas() {
  const canvas = document.getElementById("linesCanvas");
  const cursorCanvas = document.getElementById("cursorCanvas");
  if (!canvas || !cursorCanvas || ehTouch || reduzirMovimento) return;
  const ctxFundo = canvas.getContext("2d");
  const ctx = cursorCanvas.getContext("2d");
  if (!ctxFundo || !ctx) return;

  let pontos = [];
  let conexoes = [];
  let rastro = [];
  let tamanho;
  let cursorX = 0;
  let cursorY = 0;
  let cursorAtivo = false;
  document.documentElement.classList.add("has-custom-cursor");

  function configurar() {
    tamanho = configurarCanvas(canvas, ctxFundo);
    configurarCanvas(cursorCanvas, ctx);
    const total = Math.min(
      72,
      Math.max(9, Math.floor((tamanho.largura * tamanho.altura) / 52000)),
    );
    pontos = Array.from({ length: total }, () => ({
      x: Math.random() * tamanho.largura,
      y: Math.random() * tamanho.altura,
    }));
    conexoes = [];
    const distanciaMaxima = Math.min(tamanho.largura, tamanho.altura) * 0.3;
    pontos.forEach((a, indiceA) => {
      pontos.slice(indiceA + 1).forEach((b, indiceB) => {
        if (Math.hypot(a.x - b.x, a.y - b.y) < distanciaMaxima) {
          conexoes.push({ a: indiceA, b: indiceA + indiceB + 1 });
        }
      });
    });
  }

  addEventListener(
    "pointermove",
    (evento) => {
      cursorX = evento.clientX;
      cursorY = evento.clientY;
      cursorAtivo = true;
      const ultimo = rastro.at(-1);
      if (
        !ultimo ||
        Math.hypot(evento.clientX - ultimo.x, evento.clientY - ultimo.y) > 4
      ) {
        rastro.push({ x: evento.clientX, y: evento.clientY, vida: 1 });
        if (rastro.length > 44) rastro.shift();
      } else {
        ultimo.x = evento.clientX;
        ultimo.y = evento.clientY;
        ultimo.vida = 1;
      }
    },
    { passive: true },
  );
  document.documentElement.addEventListener("mouseleave", () => {
    cursorAtivo = false;
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

  function desenharPontaDoRastro() {
    if (!cursorAtivo) return;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cursorX, cursorY, 1.35, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,.82)";
    ctx.shadowColor = "rgba(255,255,255,.32)";
    ctx.shadowBlur = 4;
    ctx.fill();
    ctx.restore();
  }

  function desenhar() {
    if (!paginaVisivel) {
      requestAnimationFrame(desenhar);
      return;
    }
    ctxFundo.clearRect(0, 0, tamanho.largura, tamanho.altura);
    ctx.clearRect(0, 0, tamanho.largura, tamanho.altura);
    const total =
      conexoes.length *
      limitar(
        scrollY /
          Math.max(1, document.documentElement.scrollHeight - innerHeight),
      );
    conexoes.forEach((conexao, indice) => {
      const parcial = limitar(total - indice);
      if (!parcial) return;
      const a = pontos[conexao.a];
      const b = pontos[conexao.b];
      ctxFundo.beginPath();
      ctxFundo.moveTo(a.x, a.y);
      ctxFundo.lineTo(a.x + (b.x - a.x) * parcial, a.y + (b.y - a.y) * parcial);
      ctxFundo.strokeStyle = "rgba(237,231,226,.055)";
      ctxFundo.lineWidth = 0.5;
      ctxFundo.stroke();
    });
    desenharRastro();
    desenharPontaDoRastro();
    rastro.forEach((ponto) => {
      ponto.vida -= 0.018;
    });
    rastro = rastro.filter((ponto) => ponto.vida > 0);
    requestAnimationFrame(desenhar);
  }

  addEventListener("resize", configurar, { passive: true });
  configurar();
  desenhar();
}

function iniciarMagnetismo() {
  if (ehTouch || reduzirMovimento) return;
  document.querySelectorAll(".btn-contato").forEach((botao) => {
    botao.addEventListener("mousemove", (evento) => {
      const rect = botao.getBoundingClientRect();
      const x = (evento.clientX - rect.left - rect.width / 2) * 0.18;
      const y = (evento.clientY - rect.top - rect.height / 2) * 0.22;
      botao.style.transform = `translate(${x}px, ${y}px)`;
    });
    botao.addEventListener("mouseleave", () => {
      botao.style.transform = "translate(0,0)";
    });
  });
}

function iniciarPulsoDeClique() {
  if (ehTouch || reduzirMovimento) return;
  addEventListener(
    "pointerdown",
    (evento) => {
      const pulso = document.createElement("span");
      pulso.className = "cursor-pulse";
      pulso.style.left = `${evento.clientX}px`;
      pulso.style.top = `${evento.clientY}px`;
      document.body.appendChild(pulso);
      pulso.addEventListener("animationend", () => pulso.remove(), {
        once: true,
      });
    },
    { passive: true },
  );
}

export function iniciarEfeitos() {
  iniciarGalaxia();
  iniciarSoundwave();
  iniciarTickerStack();
  iniciarLinhas();
  iniciarMagnetismo();
  iniciarPulsoDeClique();
}

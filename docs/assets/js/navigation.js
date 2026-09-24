import { ehTouch, limitar, paginaVisivel, reduzirMovimento } from "./core.js";

const scrollContainer = document.getElementById("scrollContainer");
const scrollSpacer = document.getElementById("scrollSpacer");
const navbar = document.getElementById("navbar");
const hero = document.getElementById("hero");
const cenaHero = hero?.querySelector(".hero__scene");
const paineisHero = [...document.querySelectorAll(".hero__panel")];
const contadorHero = document.querySelector(".hero__counter span");
const dicaHero = document.querySelector(".hero__scroll-cue");
const gridProjetos = document.getElementById("projetosGrid");
const sobre = document.getElementById("sobre");
const fotoSobre = sobre?.querySelector(".sobre__foto");
const conteudoSobre = sobre?.querySelector(".sobre__conteudo");
const contato = document.getElementById("contato");
const pagina = document.documentElement;
const containerLinksNavbar = document.querySelector(".navbar__links");
const indicadorNavbar = containerLinksNavbar?.querySelector(
  ".navbar__indicator",
);
const cenasHero = [
  { centro: 0, alcance: 0.29, x: 118, y: 68, giro: 1.2 },
  { centro: 0.38, alcance: 0.29, x: -104, y: 62, giro: -0.9 },
  { centro: 0.8, alcance: 0.34, x: 90, y: -62, giro: 0.75 },
];
const linksNavegacao = [...document.querySelectorAll(".navbar__links a")].map(
  (link) => ({
    link,
    secao: document.querySelector(link.getAttribute("href")),
  }),
);
let elementosReveal = [];
let scrollAtual = scrollY;
let atualizacaoScrollPendente = false;
let quadroSmoothScroll = 0;
let linkNavbarAtual = null;
let linkNavbarEmInteracao = null;
let linkNavbarDestino = null;

function atualizarIndicadorNavbar(
  link,
  imediato = false,
  visivel = Boolean(link),
) {
  if (!indicadorNavbar) return;
  indicadorNavbar.classList.toggle("is-initializing", imediato);

  if (!link) {
    indicadorNavbar.classList.remove("is-ready");
  } else {
    indicadorNavbar.style.width = `${link.offsetWidth}px`;
    indicadorNavbar.style.height = `${link.offsetHeight}px`;
    indicadorNavbar.style.setProperty(
      "--nav-indicator-x",
      `${link.offsetLeft}px`,
    );
    indicadorNavbar.style.setProperty(
      "--nav-indicator-y",
      `${link.offsetTop}px`,
    );
    indicadorNavbar.classList.toggle("is-ready", visivel);
  }

  if (imediato) {
    requestAnimationFrame(() => {
      indicadorNavbar.classList.remove("is-initializing");
    });
  }
}

function restaurarIndicadorNavbar() {
  linkNavbarEmInteracao = null;
  const destino = linkNavbarDestino || linkNavbarAtual;
  atualizarIndicadorNavbar(
    destino || linksNavegacao[0]?.link,
    false,
    Boolean(destino),
  );
}

export function atualizarElementosReveal() {
  elementosReveal = [
    ...document.querySelectorAll(".reveal, .projeto-card, .info-card"),
  ];
}

export function atualizarReveals(
  ativarElementos = pagina.classList.contains("is-loaded") ||
    !pagina.classList.contains("is-loading"),
) {
  const medidas = elementosReveal.map((elemento) => ({
    elemento,
    rect: elemento.getBoundingClientRect(),
  }));

  medidas.forEach(({ elemento, rect }) => {
    const ehInfoCard = elemento.classList.contains("info-card");
    const indiceInfo = ehInfoCard
      ? Array.prototype.indexOf.call(elemento.parentElement.children, elemento)
      : 0;
    const atraso = ehInfoCard ? indiceInfo * 0.045 : 0;
    const entrada = reduzirMovimento
      ? 1
      : limitar(
          (innerHeight * (0.94 - atraso) - rect.top) / (innerHeight * 0.68),
        );
    const saida = reduzirMovimento
      ? 1
      : limitar((rect.bottom - innerHeight * 0.06) / (innerHeight * 0.4));
    const progresso = Math.min(entrada, saida);
    const curva = progresso * progresso * (3 - 2 * progresso);
    const direcaoInfo = [-1, 0, 1][indiceInfo % 3];
    const deslocamentoX = ehInfoCard ? (1 - curva) * direcaoInfo * 22 : 0;
    const deslocamentoY = elemento.classList.contains("contato")
      ? (1 - curva) * 56
      : elemento.classList.contains("sobre")
        ? (1 - curva) * 20
        : (1 - curva) * 40;
    const escalaInicial = elemento.classList.contains("contato")
      ? 0.955
      : elemento.classList.contains("sobre")
        ? 0.99
        : 0.978;

    elemento.style.setProperty("--reveal-opacity", curva.toFixed(3));
    elemento.style.setProperty("--reveal-x", `${deslocamentoX.toFixed(2)}px`);
    elemento.style.setProperty("--reveal-y", `${deslocamentoY.toFixed(2)}px`);
    elemento.style.setProperty(
      "--reveal-scale",
      (escalaInicial + curva * (1 - escalaInicial)).toFixed(4),
    );
    elemento.style.setProperty(
      "--reveal-rotation",
      `${(ehInfoCard ? (1 - curva) * direcaoInfo * 0.45 : 0).toFixed(3)}deg`,
    );
    if (elemento === contato) {
      elemento.style.setProperty(
        "--contact-heading-y",
        `${((1 - curva) * -18).toFixed(2)}px`,
      );
      elemento.style.setProperty(
        "--contact-links-y",
        `${((1 - curva) * 28).toFixed(2)}px`,
      );
    }
    elemento.classList.toggle("is-visible", ativarElementos && progresso > 0.1);
  });

  atualizarPilhaProjetos();
  atualizarHero();
  atualizarSobre(
    medidas.find(({ elemento }) => elemento === sobre)?.rect,
  );
  atualizarInterfaceScroll();
}

function atualizarSobre(rect = sobre?.getBoundingClientRect()) {
  if (!sobre || !rect || reduzirMovimento) return;

  const progresso = limitar(
    (innerHeight * 0.9 - rect.top) / (innerHeight * 0.82),
  );
  const curva = progresso * progresso * (3 - 2 * progresso);
  const curvaMovimento = ehTouch ? 1 : curva;

  fotoSobre?.style.setProperty(
    "--about-x",
    `${((1 - curvaMovimento) * -28).toFixed(2)}px`,
  );
  fotoSobre?.style.setProperty(
    "--about-y",
    `${((1 - curvaMovimento) * 34).toFixed(2)}px`,
  );
  fotoSobre?.style.setProperty(
    "--about-rotation",
    `${((1 - curvaMovimento) * -1.2).toFixed(3)}deg`,
  );
  conteudoSobre?.style.setProperty(
    "--about-x",
    `${((1 - curvaMovimento) * 32).toFixed(2)}px`,
  );
  conteudoSobre?.style.setProperty(
    "--about-y",
    `${((1 - curvaMovimento) * -18).toFixed(2)}px`,
  );
  const florNaAreaDeLeitura =
    rect.top < innerHeight * 0.84 && rect.bottom > innerHeight * 0.16;

  if (florNaAreaDeLeitura && !sobre.classList.contains("is-flower-ready")) {
    sobre.classList.remove("is-flower-resetting");
    void sobre.offsetWidth;
    sobre.classList.add("is-flower-ready");
  } else if (
    !florNaAreaDeLeitura &&
    sobre.classList.contains("is-flower-ready")
  ) {
    sobre.classList.add("is-flower-resetting");
    sobre.classList.remove("is-flower-ready");
  }
}

function posicaoNoConteudo(elemento) {
  let posicao = 0;
  let atual = elemento;
  while (atual && atual !== scrollContainer) {
    posicao += atual.offsetTop;
    atual = atual.offsetParent;
  }
  return posicao;
}

function atualizarPilhaProjetos() {
  if (!gridProjetos) return;
  const cards = [...gridProjetos.querySelectorAll(".projeto-card")];
  const ativa =
    !ehTouch &&
    !reduzirMovimento &&
    innerWidth > 780;

  if (!ativa) {
    cards.forEach((card) => {
      card.style.removeProperty("--stack-pin-y");
      card.style.removeProperty("--stack-scale");
      card.style.removeProperty("--stack-brightness");
      card.style.removeProperty("--stack-saturation");
      card.style.removeProperty("--media-parallax");
    });
    return;
  }

  const topoFixo = limitar(innerHeight * 0.14, 98, 150);
  const topoGrid = posicaoNoConteudo(gridProjetos);
  const alturaGrid = gridProjetos.offsetHeight;
  const medidas = cards.map((card) => ({
    card,
    topo: posicaoNoConteudo(card),
    altura: card.offsetHeight,
  }));

  medidas.forEach(({ card, topo, altura }, indice) => {
    const limitePilha =
      topoGrid + alturaGrid - altura - topo;
    const deslocamento = limitar(
      scrollAtual + topoFixo - topo,
      0,
      Math.max(0, limitePilha),
    );
    const proximo = medidas[indice + 1];
    const topoProximo = proximo
      ? proximo.topo - scrollAtual
      : Infinity;
    const inicio = innerHeight * 0.88;
    const fim = topoFixo + 24;
    const progresso = proximo
      ? limitar((inicio - topoProximo) / Math.max(1, inicio - fim))
      : 0;

    card.style.setProperty("--stack-pin-y", `${deslocamento.toFixed(2)}px`);
    card.style.setProperty("--stack-scale", (1 - progresso * 0.04).toFixed(4));
    card.style.setProperty(
      "--stack-brightness",
      (1 - progresso * 0.3).toFixed(3),
    );
    card.style.setProperty(
      "--stack-saturation",
      (1 - progresso * 0.3).toFixed(3),
    );
    card.style.setProperty(
      "--media-parallax",
      `${(-progresso * 10).toFixed(2)}px`,
    );
  });
}

function atualizarHero() {
  if (!hero || !cenaHero) return;

  const percurso = Math.max(1, hero.offsetHeight - cenaHero.offsetHeight);
  const deslocamentoNatural = reduzirMovimento
    ? 0
    : limitar(-hero.getBoundingClientRect().top, 0, percurso);
  const deslocamento = ehTouch ? 0 : deslocamentoNatural;
  const progresso = reduzirMovimento ? 0 : deslocamentoNatural / percurso;
  cenaHero.style.setProperty("--hero-pin-y", `${deslocamento.toFixed(2)}px`);
  cenaHero.style.setProperty(
    "--hero-opacity",
    (1 - limitar((progresso - 0.9) / 0.1)).toFixed(3),
  );
  cenaHero.style.setProperty(
    "--hero-scale",
    (1 - limitar((progresso - 0.86) / 0.14) * 0.035).toFixed(4),
  );
  cenaHero.style.setProperty(
    "--terminal-x",
    `${((progresso - 0.5) * -28).toFixed(2)}px`,
  );
  cenaHero.style.setProperty(
    "--terminal-y",
    `${((progresso - 0.5) * 18).toFixed(2)}px`,
  );

  let painelAtivo = 0;
  let menorDistancia = Infinity;
  paineisHero.forEach((painel, indice) => {
    const cena = cenasHero[indice];
    const distanciaNatural = (progresso - cena.centro) / cena.alcance;
    const distancia = limitar(distanciaNatural, -1.25, 1.25);
    const afastamento = Math.abs(distanciaNatural);
    const fade = limitar((afastamento - 0.1) / 0.8);
    const opacidade = 1 - fade * fade * (3 - 2 * fade);

    painel.style.setProperty("--panel-opacity", opacidade.toFixed(3));
    painel.style.setProperty(
      "--panel-x",
      `${(distancia * cena.x).toFixed(2)}px`,
    );
    painel.style.setProperty(
      "--panel-y",
      `${(distancia * cena.y).toFixed(2)}px`,
    );
    painel.style.setProperty(
      "--panel-rotation",
      `${(distancia * cena.giro).toFixed(3)}deg`,
    );
    painel.style.setProperty(
      "--panel-blur",
      `${(ehTouch ? 0 : (1 - opacidade) * 3).toFixed(2)}px`,
    );
    painel.style.setProperty(
      "--panel-scale",
      (0.985 + opacidade * 0.015).toFixed(4),
    );

    const distanciaDoCentro = Math.abs(progresso - cena.centro);
    if (distanciaDoCentro < menorDistancia) {
      menorDistancia = distanciaDoCentro;
      painelAtivo = indice;
    }
  });

  if (contadorHero)
    contadorHero.textContent = String(painelAtivo + 1).padStart(2, "0");
  if (dicaHero) dicaHero.style.opacity = String(1 - limitar(progresso / 0.12));
}

function atualizarInterfaceScroll() {
  let novoLinkAtual = null;
  linksNavegacao.forEach(({ link, secao }) => {
    if (!secao) return;
    const rect = secao.getBoundingClientRect();
    const ativa =
      rect.top <= innerHeight * 0.42 && rect.bottom > innerHeight * 0.3;
    link.classList.toggle("is-current", ativa);
    if (ativa) {
      novoLinkAtual = link;
      link.setAttribute("aria-current", "location");
    } else link.removeAttribute("aria-current");
  });

  const rectHero = hero?.getBoundingClientRect();
  const heroAtiva =
    rectHero &&
    rectHero.top <= innerHeight * 0.42 &&
    rectHero.bottom > innerHeight * 0.3;
  let estadoAlterado = false;

  if (novoLinkAtual && novoLinkAtual !== linkNavbarAtual) {
    linkNavbarAtual = novoLinkAtual;
    estadoAlterado = true;
  } else if (!novoLinkAtual && heroAtiva && linkNavbarAtual) {
    linkNavbarAtual = null;
    estadoAlterado = true;
  }

  if (linkNavbarDestino && novoLinkAtual === linkNavbarDestino) {
    linkNavbarDestino = null;
    estadoAlterado = true;
  }

  if (estadoAlterado && !linkNavbarEmInteracao) {
    const destino = linkNavbarDestino || linkNavbarAtual;
    atualizarIndicadorNavbar(
      destino || linksNavegacao[0]?.link,
      false,
      Boolean(destino),
    );
  }
}

function atualizarEstadoNavbar() {
  navbar.classList.toggle("is-scrolled", scrollY > 40);
}

function agendarAtualizacaoScroll() {
  if (atualizacaoScrollPendente) return;
  atualizacaoScrollPendente = true;
  requestAnimationFrame(() => {
    atualizacaoScrollPendente = false;
    atualizarReveals();
  });
}

export function definirAlturaSpacer() {
  if (!scrollSpacer || ehTouch || reduzirMovimento) return;
  scrollSpacer.style.height = `${scrollContainer.scrollHeight}px`;
}

function loopSmoothScroll() {
  quadroSmoothScroll = 0;
  if (!paginaVisivel) return;

  scrollAtual += (scrollY - scrollAtual) * 0.075;
  if (Math.abs(scrollY - scrollAtual) < 0.05) scrollAtual = scrollY;
  scrollContainer.style.transform = `translate3d(0, ${-scrollAtual}px, 0)`;
  atualizarReveals();
  if (scrollAtual !== scrollY) agendarSmoothScroll();
}

function agendarSmoothScroll() {
  if (quadroSmoothScroll || !paginaVisivel) return;
  quadroSmoothScroll = requestAnimationFrame(loopSmoothScroll);
}

function posicaoDaSecao(elemento) {
  return Math.max(0, posicaoNoConteudo(elemento) - 84);
}

document
  .querySelectorAll(".navbar__links a, .navbar__home, .skip-link")
  .forEach((link) => {
    link.addEventListener("click", (evento) => {
      const alvo = document.querySelector(link.getAttribute("href"));
      if (!alvo) return;
      evento.preventDefault();

      if (link.classList.contains("navbar__nav-link")) {
        linkNavbarDestino = link;
        linkNavbarEmInteracao = null;
        atualizarIndicadorNavbar(link);
      } else if (link.classList.contains("navbar__home")) {
        linkNavbarDestino = null;
        linkNavbarEmInteracao = null;
        atualizarIndicadorNavbar(linksNavegacao[0]?.link, false, false);
      }

      scrollTo({
        top: posicaoDaSecao(alvo),
        behavior: reduzirMovimento ? "auto" : "smooth",
      });
      if (link.classList.contains("skip-link")) {
        alvo.focus({ preventScroll: true });
      }
    });
  });

linksNavegacao.forEach(({ link }) => {
  link.addEventListener("mouseenter", () => {
    linkNavbarEmInteracao = link;
    atualizarIndicadorNavbar(link);
  });
  link.addEventListener("focus", () => {
    linkNavbarEmInteracao = link;
    atualizarIndicadorNavbar(link);
  });
  link.addEventListener("blur", () => {
    requestAnimationFrame(() => {
      if (!containerLinksNavbar?.contains(document.activeElement)) {
        restaurarIndicadorNavbar();
      }
    });
  });
});

containerLinksNavbar?.addEventListener("mouseleave", restaurarIndicadorNavbar);

if ("ResizeObserver" in window && containerLinksNavbar) {
  const observadorNavbar = new ResizeObserver(() => {
    const destino =
      linkNavbarEmInteracao || linkNavbarDestino || linkNavbarAtual;
    atualizarIndicadorNavbar(
      destino || linksNavegacao[0]?.link,
      true,
      Boolean(destino),
    );
  });
  linksNavegacao.forEach(({ link }) => observadorNavbar.observe(link));
}

addEventListener("scroll", atualizarEstadoNavbar, { passive: true });
addEventListener("resize", agendarAtualizacaoScroll, { passive: true });
atualizarEstadoNavbar();
requestAnimationFrame(() => {
  atualizarIndicadorNavbar(
    linkNavbarAtual || linksNavegacao[0]?.link,
    true,
    Boolean(linkNavbarAtual),
  );
});

if (ehTouch || reduzirMovimento) {
  scrollContainer.style.position = "static";
  scrollSpacer.style.display = "none";
  addEventListener("scroll", agendarAtualizacaoScroll, { passive: true });
} else if ("ResizeObserver" in window) {
  new ResizeObserver(definirAlturaSpacer).observe(scrollContainer);
} else {
  addEventListener("resize", definirAlturaSpacer, { passive: true });
}

atualizarElementosReveal();
atualizarReveals();

if (!ehTouch && !reduzirMovimento) {
  definirAlturaSpacer();
  agendarSmoothScroll();
  addEventListener("scroll", agendarSmoothScroll, { passive: true });
  addEventListener("load", definirAlturaSpacer);
  document.addEventListener("visibilitychange", agendarSmoothScroll);
}

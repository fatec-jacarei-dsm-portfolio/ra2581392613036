import { ehTouch, limitar, paginaVisivel, reduzirMovimento } from "./core.js";

const scrollContainer = document.getElementById("scrollContainer");
const scrollSpacer = document.getElementById("scrollSpacer");
const navbar = document.getElementById("navbar");
const hero = document.getElementById("hero");
const cenaHero = hero?.querySelector(".hero__scene");
const paineisHero = [...document.querySelectorAll(".hero__panel")];
const contadorHero = document.querySelector(".hero__counter span");
const dicaHero = document.querySelector(".hero__scroll-cue");
const pagina = document.documentElement;
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

export function atualizarElementosReveal() {
  elementosReveal = [
    ...document.querySelectorAll(".reveal, .projeto-card, .info-card"),
  ];
}

export function atualizarReveals(
  ativarElementos =
    pagina.classList.contains("is-loaded") ||
    !pagina.classList.contains("is-loading"),
) {
  elementosReveal.forEach((elemento, indice) => {
    const rect = elemento.getBoundingClientRect();
    const atraso = elemento.classList.contains("info-card")
      ? (indice % 3) * 0.045
      : 0;
    const entrada = reduzirMovimento
      ? 1
      : limitar(
          (innerHeight * (0.92 - atraso) - rect.top) / (innerHeight * 0.56),
        );
    const saida = reduzirMovimento
      ? 1
      : limitar((rect.bottom - innerHeight * 0.06) / (innerHeight * 0.4));
    const progresso = Math.min(entrada, saida);
    const curva = 1 - (1 - progresso) ** 3;

    elemento.style.setProperty("--reveal-opacity", curva.toFixed(3));
    elemento.style.setProperty(
      "--reveal-y",
      `${((1 - curva) * 46).toFixed(2)}px`,
    );
    elemento.style.setProperty(
      "--reveal-scale",
      (0.978 + curva * 0.022).toFixed(4),
    );
    elemento.classList.toggle(
      "is-visible",
      ativarElementos && progresso > 0.1,
    );
  });

  atualizarHero();
  atualizarInterfaceScroll();
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
    "--hero-light-x",
    `${((progresso - 0.5) * 16).toFixed(2)}%`,
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
      `${((1 - opacidade) * 3).toFixed(2)}px`,
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
  linksNavegacao.forEach(({ link, secao }) => {
    if (!secao) return;
    const rect = secao.getBoundingClientRect();
    const ativa =
      rect.top <= innerHeight * 0.42 && rect.bottom > innerHeight * 0.3;
    link.classList.toggle("is-current", ativa);
    if (ativa) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
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
  if (!paginaVisivel) {
    requestAnimationFrame(loopSmoothScroll);
    return;
  }
  scrollAtual += (scrollY - scrollAtual) * 0.075;
  if (Math.abs(scrollY - scrollAtual) < 0.05) scrollAtual = scrollY;
  scrollContainer.style.transform = `translate3d(0, ${-scrollAtual}px, 0)`;
  atualizarReveals();
  requestAnimationFrame(loopSmoothScroll);
}

function posicaoDaSecao(elemento) {
  let posicao = 0;
  let atual = elemento;
  while (atual && atual !== scrollContainer) {
    posicao += atual.offsetTop;
    atual = atual.offsetParent;
  }
  return Math.max(0, posicao - 84);
}

document
  .querySelectorAll(".navbar__links a, .navbar__home, .skip-link")
  .forEach((link) => {
    link.addEventListener("click", (evento) => {
      const alvo = document.querySelector(link.getAttribute("href"));
      if (!alvo) return;
      evento.preventDefault();
      scrollTo({
        top: posicaoDaSecao(alvo),
        behavior: reduzirMovimento ? "auto" : "smooth",
      });
    });
  });

addEventListener("scroll", atualizarEstadoNavbar, { passive: true });
atualizarEstadoNavbar();

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
  requestAnimationFrame(loopSmoothScroll);
  addEventListener("load", definirAlturaSpacer);
}

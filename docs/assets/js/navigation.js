import { ehTouch, limitar, paginaVisivel, reduzirMovimento } from "./core.js";

const scrollContainer = document.getElementById("scrollContainer");
const scrollSpacer = document.getElementById("scrollSpacer");
const navbar = document.getElementById("navbar");
const linksNavegacao = [...document.querySelectorAll(".navbar__links a")].map(
  (link) => ({
    link,
    secao: document.querySelector(link.getAttribute("href")),
  }),
);
let elementosReveal = [];
let scrollAtual = scrollY;

export function atualizarElementosReveal() {
  elementosReveal = [
    ...document.querySelectorAll(".reveal, .projeto-card, .info-card"),
  ];
}

export function atualizarReveals() {
  elementosReveal.forEach((elemento, indice) => {
    const rect = elemento.getBoundingClientRect();
    const atraso = elemento.classList.contains("info-card")
      ? (indice % 3) * 0.045
      : 0;
    const entrada = reduzirMovimento
      ? 1
      : limitar(
          (innerHeight * (0.92 - atraso) - rect.top) / (innerHeight * 0.42),
        );
    const saida = reduzirMovimento
      ? 1
      : limitar((rect.bottom - innerHeight * 0.06) / (innerHeight * 0.3));
    const progresso = Math.min(entrada, saida);
    const curva = 1 - (1 - progresso) ** 3;

    elemento.style.setProperty("--reveal-opacity", curva.toFixed(3));
    elemento.style.setProperty(
      "--reveal-y",
      `${((1 - curva) * 68).toFixed(2)}px`,
    );
    elemento.style.setProperty(
      "--reveal-scale",
      (0.978 + curva * 0.022).toFixed(4),
    );
    elemento.classList.toggle("is-visible", progresso > 0.1);
  });

  const hero = document.getElementById("hero");
  const conteudoHero = document.querySelector(".hero__content");
  if (hero && conteudoHero && !reduzirMovimento) {
    const progresso = limitar(-hero.getBoundingClientRect().top / innerHeight);
    conteudoHero.style.setProperty(
      "--hero-parallax",
      `${(-progresso * 72).toFixed(2)}px`,
    );
    conteudoHero.style.setProperty("--hero-fade", String(1 - progresso * 0.72));
  }

  atualizarInterfaceScroll();
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

export function definirAlturaSpacer() {
  if (!scrollSpacer || ehTouch || reduzirMovimento) return;
  scrollSpacer.style.height = `${scrollContainer.scrollHeight}px`;
}

function loopSmoothScroll() {
  if (!paginaVisivel) {
    requestAnimationFrame(loopSmoothScroll);
    return;
  }
  scrollAtual += (scrollY - scrollAtual) * 0.095;
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
  addEventListener("scroll", atualizarReveals, { passive: true });
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

import { reduzirMovimento, salvarIdioma, state } from "./core.js";
import { definirAlturaSpacer } from "./navigation.js";
import { renderProjetos } from "./projects.js";

const langToggle = document.getElementById("langToggle");
const langThumb = langToggle.querySelector(".navbar__lang-thumb");
const seletoresTransicaoIdioma = [
  ".navbar__links",
  ".ticker__label",
  ".sobre__conteudo",
  ".projetos__header",
  "#projetosGrid",
  ".info-complementar",
  ".contato",
  ".footer",
];
let idiomaTrocando = false;

function aplicarTraducoes(seletor, chaveDataset, aplicar) {
  document.querySelectorAll(seletor).forEach((elemento) => {
    const valor = state.traducoes[elemento.dataset[chaveDataset]];
    if (valor) aplicar(elemento, valor);
  });
}

function obterAlvosTransicaoIdioma() {
  return seletoresTransicaoIdioma
    .map((seletor) => document.querySelector(seletor))
    .filter(Boolean);
}

function iniciarAnimacoes(elementos, quadros, opcoes) {
  return elementos.map((elemento) => elemento.animate(quadros, opcoes));
}

async function aguardarAnimacoes(animacoes) {
  await Promise.all(
    animacoes.map((animacao) => animacao.finished.catch(() => {})),
  );
}

function aguardarProximoQuadro() {
  return new Promise((resolve) => requestAnimationFrame(resolve));
}

function aguardarMovimentoDoSwitch() {
  return new Promise((resolve) => {
    let finalizado = false;
    const fallback = setTimeout(concluir, 650);

    function concluir(evento) {
      if (
        finalizado ||
        (evento &&
          (evento.target !== langThumb || evento.propertyName !== "transform"))
      )
        return;

      finalizado = true;
      clearTimeout(fallback);
      langThumb.removeEventListener("transitionend", concluir);
      resolve();
    }

    langThumb.addEventListener("transitionend", concluir);
  });
}

async function buscarTraducoes(lang) {
  try {
    const resposta = await fetch(`locales/${lang}.json`);
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
    return await resposta.json();
  } catch (erro) {
    console.warn("Não foi possível carregar o idioma solicitado.", erro);
    return null;
  }
}

export async function carregarIdioma(lang, traducoesProntas = null) {
  const proximoIdioma = lang === "en" ? "en" : "pt";
  const novasTraducoes =
    traducoesProntas || (await buscarTraducoes(proximoIdioma));
  if (!novasTraducoes) return false;

  state.idiomaAtual = proximoIdioma;
  state.traducoes = novasTraducoes;
  document.documentElement.lang = proximoIdioma === "pt" ? "pt-BR" : "en";
  document.title = state.traducoes["meta.title"] || document.title;
  document
    .querySelector('meta[name="description"]')
    ?.setAttribute("content", state.traducoes["meta.description"] || "");
  salvarIdioma(proximoIdioma);

  aplicarTraducoes("[data-i18n]", "i18n", (elemento, valor) => {
    elemento.innerHTML = valor;
    if (elemento.hasAttribute("data-text")) elemento.dataset.text = valor;
  });
  aplicarTraducoes("[data-i18n-aria]", "i18nAria", (elemento, valor) =>
    elemento.setAttribute("aria-label", valor),
  );
  aplicarTraducoes("[data-i18n-alt]", "i18nAlt", (elemento, valor) =>
    elemento.setAttribute("alt", valor),
  );

  const inglesAtivo = proximoIdioma === "en";
  langToggle.classList.toggle("is-en", inglesAtivo);
  langToggle.setAttribute("aria-checked", String(inglesAtivo));
  renderProjetos();
  requestAnimationFrame(definirAlturaSpacer);
  dispatchEvent(new CustomEvent("languagechange"));
  return true;
}

async function trocarIdiomaComAnimacao() {
  if (idiomaTrocando) return;
  idiomaTrocando = true;

  try {
    const proximoIdioma = state.idiomaAtual === "pt" ? "en" : "pt";
    const novasTraducoes = await buscarTraducoes(proximoIdioma);
    if (!novasTraducoes) return;

    if (reduzirMovimento || !("animate" in Element.prototype)) {
      await carregarIdioma(proximoIdioma, novasTraducoes);
      return;
    }

    langToggle.classList.add("is-switching");
    const fimMovimentoSwitch = aguardarMovimentoDoSwitch();
    langToggle.classList.toggle("is-en", proximoIdioma === "en");
    const alvos = obterAlvosTransicaoIdioma();
    const animacoesSaida = iniciarAnimacoes(
      alvos,
      [
        { opacity: 1, filter: "blur(0)" },
        { opacity: 0, filter: "blur(3px)" },
      ],
      {
        duration: 500,
        easing: "cubic-bezier(0.4, 0, 0.6, 1)",
        fill: "forwards",
      },
    );

    await Promise.all([
      aguardarAnimacoes(animacoesSaida),
      fimMovimentoSwitch,
    ]);
    await carregarIdioma(proximoIdioma, novasTraducoes);
    await aguardarProximoQuadro();

    const animacoesEntrada = iniciarAnimacoes(
      alvos,
      [
        { opacity: 0, filter: "blur(3px)" },
        { opacity: 1, filter: "blur(0)" },
      ],
      {
        duration: 480,
        easing: "cubic-bezier(0.16, 1, 0.3, 1)",
        fill: "forwards",
      },
    );

    await aguardarAnimacoes(animacoesEntrada);
    animacoesSaida.forEach((animacao) => animacao.cancel());
    animacoesEntrada.forEach((animacao) => animacao.cancel());
  } finally {
    langToggle.classList.remove("is-switching");
    idiomaTrocando = false;
  }
}

langToggle.addEventListener("click", trocarIdiomaComAnimacao);

import { reduzirMovimento, salvarIdioma, state } from "./core.js";
import { definirAlturaSpacer } from "./navigation.js";
import { renderProjetos } from "./projects.js";

const langToggle = document.getElementById("langToggle");
let idiomaTrocando = false;

function aplicarTraducoes(seletor, chaveDataset, aplicar) {
  document.querySelectorAll(seletor).forEach((elemento) => {
    const valor = state.traducoes[elemento.dataset[chaveDataset]];
    if (valor) aplicar(elemento, valor);
  });
}

export async function carregarIdioma(lang) {
  const proximoIdioma = lang === "en" ? "en" : "pt";
  let novasTraducoes;

  try {
    const resposta = await fetch(`locales/${proximoIdioma}.json`);
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
    novasTraducoes = await resposta.json();
  } catch (erro) {
    console.warn("Não foi possível carregar o idioma solicitado.", erro);
    return false;
  }

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
  return true;
}

async function trocarIdiomaComAnimacao() {
  if (idiomaTrocando) return;
  idiomaTrocando = true;

  try {
    if (!reduzirMovimento) {
      document.documentElement.classList.add("is-changing-language");
      langToggle.classList.add("is-switching");
      await new Promise((resolve) => setTimeout(resolve, 180));
    }

    await carregarIdioma(state.idiomaAtual === "pt" ? "en" : "pt");
    if (!reduzirMovimento)
      await new Promise((resolve) => setTimeout(resolve, 360));
  } finally {
    document.documentElement.classList.remove("is-changing-language");
    langToggle.classList.remove("is-switching");
    idiomaTrocando = false;
  }
}

langToggle.addEventListener("click", trocarIdiomaComAnimacao);

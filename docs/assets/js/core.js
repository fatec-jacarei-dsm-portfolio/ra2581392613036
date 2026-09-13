export const reduzirMovimento = matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;
export const ehTouch = matchMedia("(pointer: coarse)").matches;

export const state = {
  idiomaAtual: "pt",
  categoriaAtiva: "todos",
  viewAtiva: "grid",
  traducoes: {},
};

export let paginaVisivel = !document.hidden;

document.addEventListener("visibilitychange", () => {
  paginaVisivel = !document.hidden;
  document.documentElement.classList.toggle("is-paused", !paginaVisivel);
});

export function lerIdiomaSalvo() {
  try {
    return localStorage.getItem("idioma") === "en" ? "en" : "pt";
  } catch {
    return "pt";
  }
}

export function salvarIdioma(lang) {
  try {
    localStorage.setItem("idioma", lang);
  } catch {
    return;
  }
}

export const texto = (valor) =>
  valor && typeof valor === "object"
    ? valor[state.idiomaAtual] || valor.pt || ""
    : (valor ?? "");

export const limitar = (valor, minimo = 0, maximo = 1) =>
  Math.min(maximo, Math.max(minimo, valor));

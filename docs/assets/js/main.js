import { lerIdiomaSalvo } from "./core.js";
import { carregarIdioma } from "./i18n.js";
import { renderProjetos } from "./projects.js";
import { iniciarEfeitosInterativos, prepararEfeitos } from "./effects.js";
import { iniciarIntro } from "./intro.js";
import { atualizarReveals } from "./navigation.js";

async function iniciarApp() {
  const carregado = await carregarIdioma(lerIdiomaSalvo());
  if (!carregado) renderProjetos();
  prepararEfeitos();
  await iniciarIntro(atualizarReveals);
  atualizarReveals();
  iniciarEfeitosInterativos();
}

iniciarApp().catch((erro) => {
  document.documentElement.classList.remove("is-loading");
  document.documentElement.classList.add("is-loaded");
  document.getElementById("siteLoader")?.remove();
  atualizarReveals();
  console.error("Não foi possível inicializar o portfólio.", erro);
});

import { lerIdiomaSalvo } from "./core.js";
import { carregarIdioma } from "./i18n.js";
import { renderProjetos } from "./projects.js";
import { iniciarEfeitos } from "./effects.js";

carregarIdioma(lerIdiomaSalvo()).then((carregado) => {
  if (!carregado) renderProjetos();
});
iniciarEfeitos();

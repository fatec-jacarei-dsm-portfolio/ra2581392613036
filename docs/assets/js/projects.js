import { ehTouch, reduzirMovimento, state, texto } from "./core.js";
import { projetos } from "./projects-data.js";
import {
  atualizarElementosReveal,
  atualizarReveals,
  definirAlturaSpacer,
} from "./navigation.js";

const grid = document.getElementById("projetosGrid");
const modalOverlay = document.getElementById("modalOverlay");
const modal = modalOverlay.querySelector(".modal");
const modalClose = document.getElementById("modalClose");
const scrollContainer = document.getElementById("scrollContainer");
const navbar = document.getElementById("navbar");
const filtros = document.querySelector(".projetos__filtros");
const indicadorFiltro = filtros?.querySelector(".projetos__filtro-indicator");
let elementoFocoAnterior = null;
let trocaEmAndamento = false;
let videoAtivo = null;
let temporizadorModal = 0;

const mensagens = {
  pt: {
    categorias: {
      academico: "Acadêmico",
      profissional: "Profissional",
      pessoal: "Pessoal",
    },
    vazio: "Nenhum projeto nesta categoria.",
    abrir: "Abrir projeto",
    capa: "Capa do projeto",
    acao: "VER PROJETO",
    repositorio: "Ver repositório",
  },
  en: {
    categorias: {
      academico: "Academic",
      profissional: "Professional",
      pessoal: "Personal",
    },
    vazio: "No projects in this category.",
    abrir: "Open project",
    capa: "Project cover",
    acao: "VIEW PROJECT",
    repositorio: "View repository",
  },
};

const interfaceAtual = () => mensagens[state.idiomaAtual] || mensagens.pt;

function pararVideo(video = videoAtivo) {
  if (!video) return;
  video.closest(".projeto-card")?.classList.remove("is-video-playing");
  video.pause();
  video.currentTime = 0;
  if (video === videoAtivo) videoAtivo = null;
}

function rotuloCategoria(categoria) {
  return interfaceAtual().categorias[categoria] || categoria;
}

function atualizarIndicadorFiltro(botao, imediato = false) {
  if (!indicadorFiltro || !botao) return;
  indicadorFiltro.classList.toggle("is-initializing", imediato);
  indicadorFiltro.style.width = `${botao.offsetWidth}px`;
  indicadorFiltro.style.height = `${botao.offsetHeight}px`;
  indicadorFiltro.style.setProperty("--indicator-x", `${botao.offsetLeft}px`);
  indicadorFiltro.style.setProperty("--indicator-y", `${botao.offsetTop}px`);
  indicadorFiltro.classList.add("is-ready");

  if (imediato) {
    requestAnimationFrame(() => {
      indicadorFiltro.classList.remove("is-initializing");
    });
  }
}

export function renderProjetos() {
  pararVideo();
  const filtrados =
    state.categoriaAtiva === "todos"
      ? projetos
      : projetos.filter(
          (projeto) => projeto.categoria === state.categoriaAtiva,
        );

  grid.replaceChildren();

  if (!filtrados.length) {
    const vazio = document.createElement("p");
    vazio.className = "projetos__vazio reveal";
    vazio.setAttribute("role", "status");
    vazio.textContent = interfaceAtual().vazio;
    grid.appendChild(vazio);
    atualizarElementosReveal();
    atualizarReveals();
    return;
  }

  filtrados.forEach((projeto, index) => {
    const numeroFaixa = String(projeto.faixa || index + 1).padStart(2, "0");
    const nomeProjeto = texto(projeto.nome);
    const card = document.createElement("article");
    card.style.zIndex = String(index + 1);

    if (projeto.emBreve) {
      card.className = "projeto-card projeto-card--coming-soon";
      card.innerHTML = `
        <div class="projeto-card__media projeto-card__media--placeholder" aria-hidden="true">
          <span class="projeto-card__track">TRACK ${numeroFaixa}</span>
        </div>
        <div class="projeto-card__body">
          <div class="projeto-card__meta">
            <span class="projeto-card__categoria">${texto(projeto.status)}</span>
            <span class="projeto-card__semestre">${texto(projeto.lancamento)}</span>
          </div>
          <h3 class="projeto-card__nome glitch-heading" data-text="${nomeProjeto}">${nomeProjeto}</h3>
          <p class="projeto-card__desc">${texto(projeto.descricao)}</p>
        </div>`;
      grid.appendChild(card);
      return;
    }

    const dimensoesImagem =
      projeto.imagemLargura && projeto.imagemAltura
        ? ` width="${projeto.imagemLargura}" height="${projeto.imagemAltura}"`
        : "";
    card.className = "projeto-card";
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-haspopup", "dialog");
    card.setAttribute(
      "aria-label",
      `${interfaceAtual().abrir}: ${nomeProjeto}`,
    );

    card.innerHTML = `
      <div class="projeto-card__media">
        <img src="${projeto.imagem}" alt="${interfaceAtual().capa}: ${nomeProjeto}"${dimensoesImagem} loading="lazy" decoding="async">
        ${projeto.video ? `<video src="${projeto.video}" muted loop playsinline preload="metadata" aria-hidden="true"></video>` : ""}
        <span class="projeto-card__track" aria-hidden="true">TRACK ${numeroFaixa}</span>
      </div>
      <div class="projeto-card__body">
        <div class="projeto-card__meta">
          <span class="projeto-card__categoria">${rotuloCategoria(projeto.categoria)}</span>
          <span class="projeto-card__semestre">${texto(projeto.semestre)}</span>
        </div>
        <h3 class="projeto-card__nome glitch-heading" data-text="${nomeProjeto}">${nomeProjeto}</h3>
        <p class="projeto-card__desc">${texto(projeto.descricao)}</p>
        <span class="projeto-card__abrir" aria-hidden="true">
          ${interfaceAtual().acao}
          <span class="projeto-card__abrir-seta"></span>
        </span>
      </div>`;

    const abrir = () => abrirModal(projeto, card);
    card.addEventListener("click", abrir);
    card.addEventListener("keydown", (evento) => {
      if (evento.key === "Enter" || evento.key === " ") {
        evento.preventDefault();
        abrir();
      }
    });

    const video = card.querySelector("video");
    if (video && !reduzirMovimento && !ehTouch) {
      video.defaultPlaybackRate = projeto.velocidadeVideo || 1;
      video.playbackRate = projeto.velocidadeVideo || 1;
      card.addEventListener("mouseenter", async () => {
        if (videoAtivo !== video) pararVideo();
        video.playbackRate = projeto.velocidadeVideo || 1;
        videoAtivo = video;
        try {
          await video.play();
          if (videoAtivo === video) card.classList.add("is-video-playing");
        } catch {
          card.classList.remove("is-video-playing");
        }
      });
      card.addEventListener("mouseleave", () => {
        card.classList.remove("is-video-playing");
        pararVideo(video);
      });
    }
    grid.appendChild(card);
  });

  atualizarElementosReveal();
  atualizarReveals();
  requestAnimationFrame(definirAlturaSpacer);
}

async function animarTrocaProjetos(atualizarEstado) {
  if (trocaEmAndamento) return;
  if (reduzirMovimento) {
    atualizarEstado();
    renderProjetos();
    return;
  }

  trocaEmAndamento = true;
  grid.setAttribute("aria-busy", "true");
  grid.classList.add("is-filtering");
  let projetosRenderizados = false;

  const atualizarProjetos = () => {
    if (projetosRenderizados) return;
    projetosRenderizados = true;
    renderProjetos();
  };

  try {
    atualizarEstado();
    await new Promise((resolve) => setTimeout(resolve, 220));

    const itensAtuais = [...grid.children];
    const saidas = itensAtuais.map((item, indice) =>
      item.animate(
        [
          { opacity: getComputedStyle(item).opacity, translate: "0 0" },
          { opacity: 0, translate: "0 28px" },
        ],
        {
          duration: 500,
          delay: indice * 75,
          easing: "cubic-bezier(.4, 0, .2, 1)",
          fill: "forwards",
        },
      ),
    );
    await Promise.all(
      saidas.map((animacao) => animacao.finished.catch(() => {})),
    );
    await new Promise((resolve) => setTimeout(resolve, 200));

    atualizarProjetos();

    const novosItens = [...grid.children];
    const entradas = novosItens.map((item, indice) =>
      item.animate(
        [
          { opacity: 0, translate: "0 28px" },
          { opacity: 0.55, translate: "0 11px", offset: 0.48 },
          { opacity: getComputedStyle(item).opacity, translate: "0 0" },
        ],
        {
          duration: 700,
          delay: (novosItens.length - 1 - indice) * 80,
          easing: "cubic-bezier(.22, .61, .36, 1)",
          fill: "backwards",
        },
      ),
    );
    await Promise.all(
      entradas.map((animacao) => animacao.finished.catch(() => {})),
    );
  } catch {
    atualizarProjetos();
  } finally {
    grid.classList.remove("is-filtering");
    grid.removeAttribute("aria-busy");
    trocaEmAndamento = false;
  }
}

document.querySelectorAll(".filtro-btn").forEach((botao) => {
  botao.addEventListener("click", () => {
    if (botao.dataset.categoria === state.categoriaAtiva) return;
    animarTrocaProjetos(() => {
      document.querySelectorAll(".filtro-btn").forEach((item) => {
        const ativo = item === botao;
        item.classList.toggle("is-active", ativo);
        item.setAttribute("aria-pressed", String(ativo));
      });
      atualizarIndicadorFiltro(botao);
      state.categoriaAtiva = botao.dataset.categoria;
    });
  });
});

requestAnimationFrame(() => {
  atualizarIndicadorFiltro(document.querySelector(".filtro-btn.is-active"), true);
});

if ("ResizeObserver" in window && filtros) {
  const observadorFiltros = new ResizeObserver(() => {
    atualizarIndicadorFiltro(document.querySelector(".filtro-btn.is-active"));
  });
  filtros.querySelectorAll(".filtro-btn").forEach((botao) => {
    observadorFiltros.observe(botao);
  });
}

function abrirModal(projeto, origem) {
  clearTimeout(temporizadorModal);
  pararVideo();
  elementoFocoAnterior = origem || document.activeElement;
  const nomeProjeto = texto(projeto.nome);
  document.getElementById("modalCategoria").textContent = rotuloCategoria(
    projeto.categoria,
  );
  const titulo = document.getElementById("modalTitle");
  titulo.textContent = nomeProjeto;
  titulo.dataset.text = nomeProjeto;
  document.getElementById("modalSemestre").textContent = texto(
    projeto.semestre,
  );
  document.getElementById("modalDescricao").textContent = texto(
    projeto.descricao,
  );
  document.getElementById("modalContribuicao").textContent = texto(
    projeto.contribuicao,
  );

  const tecnologias = document.getElementById("modalTech");
  tecnologias.replaceChildren(
    ...projeto.tecnologias.map((tecnologia) => {
      const item = document.createElement("span");
      item.textContent = tecnologia;
      return item;
    }),
  );

  const repo = document.getElementById("modalRepoLink");
  repo.href = projeto.repo;
  repo.hidden = !projeto.repo;
  repo.setAttribute(
    "aria-label",
    `${interfaceAtual().repositorio}: ${nomeProjeto}`,
  );

  modalOverlay.classList.add("is-active");
  const origemRect = origem?.getBoundingClientRect();
  const modalRect = modal.getBoundingClientRect();
  if (origemRect && modalRect.width && modalRect.height) {
    const origemX = origemRect.left + origemRect.width / 2;
    const origemY = origemRect.top + origemRect.height / 2;
    const modalX = modalRect.left + modalRect.width / 2;
    const modalY = modalRect.top + modalRect.height / 2;
    const escala = Math.min(
      0.86,
      Math.max(
        0.52,
        Math.min(
          origemRect.width / modalRect.width,
          origemRect.height / modalRect.height,
        ),
      ),
    );
    modal.style.setProperty("--modal-from-x", `${origemX - modalX}px`);
    modal.style.setProperty("--modal-from-y", `${origemY - modalY}px`);
    modal.style.setProperty("--modal-from-scale", escala.toFixed(3));
  }

  scrollContainer.inert = true;
  navbar.inert = true;
  modalOverlay.inert = false;
  modalOverlay.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-aberto");
  modal.getBoundingClientRect();
  requestAnimationFrame(() => {
    modalOverlay.classList.add("is-open");
    modalClose.focus();
  });
}

function fecharModal() {
  if (!modalOverlay.classList.contains("is-open")) return;
  modalOverlay.classList.remove("is-open");
  modalOverlay.setAttribute("aria-hidden", "true");
  modalOverlay.inert = true;
  scrollContainer.inert = false;
  navbar.inert = false;
  if (elementoFocoAnterior?.isConnected) elementoFocoAnterior.focus();

  const concluir = () => {
    modalOverlay.classList.remove("is-active");
    document.body.classList.remove("modal-aberto");
  };

  if (reduzirMovimento) {
    concluir();
    return;
  }
  temporizadorModal = setTimeout(concluir, 580);
}

modalClose.addEventListener("click", fecharModal);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) pararVideo();
});
modalOverlay.addEventListener("click", (evento) => {
  if (evento.target === modalOverlay) fecharModal();
});
document.addEventListener("keydown", (evento) => {
  if (!modalOverlay.classList.contains("is-open")) return;
  if (evento.key === "Escape") fecharModal();
  if (evento.key !== "Tab") return;

  const focaveis = [
    ...modal.querySelectorAll(
      'button, a[href]:not([hidden]), [tabindex]:not([tabindex="-1"])',
    ),
  ];
  const primeiro = focaveis[0];
  const ultimo = focaveis.at(-1);
  if (evento.shiftKey && document.activeElement === primeiro) {
    evento.preventDefault();
    ultimo.focus();
  } else if (!evento.shiftKey && document.activeElement === ultimo) {
    evento.preventDefault();
    primeiro.focus();
  }
});

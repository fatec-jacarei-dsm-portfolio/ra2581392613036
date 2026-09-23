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

export function renderProjetos() {
  pararVideo();
  const filtrados =
    state.categoriaAtiva === "todos"
      ? projetos
      : projetos.filter(
          (projeto) => projeto.categoria === state.categoriaAtiva,
        );

  grid.replaceChildren();
  grid.dataset.view = state.viewAtiva;

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
    const dimensoesImagem =
      projeto.imagemLargura && projeto.imagemAltura
        ? ` width="${projeto.imagemLargura}" height="${projeto.imagemAltura}"`
        : "";
    const card = document.createElement("article");
    card.className = "projeto-card";
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-haspopup", "dialog");
    card.setAttribute(
      "aria-label",
      `${interfaceAtual().abrir}: ${projeto.nome}`,
    );
    card.style.zIndex = String(index + 1);

    card.innerHTML = `
      <div class="projeto-card__media">
        <img src="${projeto.imagem}" alt="${interfaceAtual().capa}: ${projeto.nome}"${dimensoesImagem} loading="lazy" decoding="async">
        ${projeto.video ? `<video src="${projeto.video}" muted loop playsinline preload="metadata" aria-hidden="true"></video>` : ""}
        <span class="projeto-card__track" aria-hidden="true">TRACK ${String(index + 1).padStart(2, "0")}</span>
      </div>
      <div class="projeto-card__body">
        <div class="projeto-card__meta">
          <span class="projeto-card__categoria">${rotuloCategoria(projeto.categoria)}</span>
          <span class="projeto-card__semestre">${texto(projeto.semestre)}</span>
        </div>
        <h3 class="projeto-card__nome glitch-heading" data-text="${projeto.nome}">${projeto.nome}</h3>
        <p class="projeto-card__desc">${texto(projeto.descricao)}</p>
        <span class="projeto-card__abrir" aria-hidden="true">${interfaceAtual().acao} ↗</span>
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
  const controles = [...document.querySelectorAll(".filtro-btn, .view-btn")];
  controles.forEach((controle) => {
    controle.disabled = true;
  });
  grid.setAttribute("aria-busy", "true");

  try {
    const saida = grid.animate(
      [
        {
          opacity: 1,
          transform: "translate3d(0, 0, 0) scale(1)",
          filter: "blur(0)",
        },
        {
          opacity: 0,
          transform: "translate3d(0, 18px, 0) scale(.985)",
          filter: "blur(5px)",
        },
      ],
      { duration: 180, easing: "cubic-bezier(.4, 0, 1, 1)", fill: "forwards" },
    );
    await saida.finished.catch(() => {});
    saida.cancel();

    atualizarEstado();
    renderProjetos();

    const entrada = grid.animate(
      [
        {
          opacity: 0,
          transform: "translate3d(0, -14px, 0) scale(.99)",
          filter: "blur(5px)",
        },
        {
          opacity: 1,
          transform: "translate3d(0, 0, 0) scale(1)",
          filter: "blur(0)",
        },
      ],
      {
        duration: 360,
        easing: "cubic-bezier(.16, 1, .3, 1)",
        fill: "forwards",
      },
    );
    await entrada.finished.catch(() => {});
    entrada.cancel();
  } finally {
    controles.forEach((controle) => {
      controle.disabled = false;
    });
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
      state.categoriaAtiva = botao.dataset.categoria;
    });
  });
});

document.querySelectorAll(".view-btn").forEach((botao) => {
  botao.addEventListener("click", () => {
    if (botao.dataset.view === state.viewAtiva) return;
    animarTrocaProjetos(() => {
      document.querySelectorAll(".view-btn").forEach((item) => {
        const ativo = item === botao;
        item.classList.toggle("is-active", ativo);
        item.setAttribute("aria-pressed", String(ativo));
      });
      state.viewAtiva = botao.dataset.view;
    });
  });
});

function abrirModal(projeto, origem) {
  clearTimeout(temporizadorModal);
  elementoFocoAnterior = origem || document.activeElement;
  document.getElementById("modalCategoria").textContent = rotuloCategoria(
    projeto.categoria,
  );
  const titulo = document.getElementById("modalTitle");
  titulo.textContent = projeto.nome;
  titulo.dataset.text = projeto.nome;
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
    `${interfaceAtual().repositorio}: ${projeto.nome}`,
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

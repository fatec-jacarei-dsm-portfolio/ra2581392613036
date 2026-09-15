import { reduzirMovimento } from "./core.js";

const loader = document.getElementById("siteLoader");
const relogio = document.getElementById("loaderClock");
const pagina = document.documentElement;
const TEMPO_ANIMACAO = 2400;
const LIMITE_TOTAL = 8000;
const TEMPO_FINAL_ATRASADO = 520;
const ATRASO_REVELACAO = 100;
const TEMPO_REVELACAO = 850;
const formatadorBrasilia = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function obterHorarioBrasilia() {
  const agora = new Date();
  const partes = Object.fromEntries(
    formatadorBrasilia
      .formatToParts(agora)
      .filter(({ type }) => type !== "literal")
      .map(({ type, value }) => [type, Number(value)]),
  );
  const segundos = partes.second + agora.getMilliseconds() / 1000;

  return {
    hora: ((partes.hour % 12) + partes.minute / 60 + segundos / 3600) * 30,
    minuto: (partes.minute + segundos / 60) * 6,
  };
}

function comLimite(promessa, limite = 7000) {
  return new Promise((resolve) => {
    const concluir = () => {
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(concluir, limite);
    Promise.resolve(promessa).then(concluir, concluir);
  });
}

function aguardarImagem(imagem) {
  imagem.loading = "eager";
  if (imagem.complete)
    return imagem.naturalWidth
      ? imagem.decode?.() || Promise.resolve()
      : Promise.resolve();

  return new Promise((resolve) => {
    imagem.addEventListener("load", resolve, { once: true });
    imagem.addEventListener("error", resolve, { once: true });
  });
}

function aguardarVideo(video) {
  if (video.readyState >= HTMLMediaElement.HAVE_METADATA)
    return Promise.resolve();
  video.load();
  return new Promise((resolve) => {
    video.addEventListener("loadedmetadata", resolve, { once: true });
    video.addEventListener("error", resolve, { once: true });
  });
}

function coletarCarregamentos() {
  const tarefas = [];

  if (document.fonts?.ready) tarefas.push(document.fonts.ready);
  if (document.readyState !== "complete") {
    tarefas.push(
      new Promise((resolve) =>
        addEventListener("load", resolve, { once: true }),
      ),
    );
  }

  document.querySelectorAll("img").forEach((imagem) => {
    tarefas.push(aguardarImagem(imagem));
  });
  document.querySelectorAll("video").forEach((video) => {
    tarefas.push(aguardarVideo(video));
  });

  const sprites = new Set(
    [...document.querySelectorAll("use[href]")]
      .map((use) => use.getAttribute("href")?.split("#")[0])
      .filter(Boolean),
  );
  sprites.forEach((url) => {
    tarefas.push(fetch(url).then((resposta) => resposta.arrayBuffer()));
  });

  return tarefas.map((tarefa) => comLimite(tarefa));
}

function atualizarRelogio(progresso, inicio, agora, horarioInicial) {
  const segundosDecorridos = (agora - inicio) / 1000;
  const horaFinal = horarioInicial.hora + segundosDecorridos / 120;
  const minutoFinal = horarioInicial.minuto + segundosDecorridos / 10;

  relogio.style.setProperty(
    "--clock-hour",
    `${(horaFinal - (1 - progresso) * 30).toFixed(3)}deg`,
  );
  relogio.style.setProperty(
    "--clock-minute",
    `${(minutoFinal - (1 - progresso) * 360).toFixed(3)}deg`,
  );
}

function encerrarIntro(aoEncerrar, prepararPagina) {
  loader.classList.add("is-complete");

  setTimeout(() => {
    prepararPagina(true);
    pagina.classList.add("is-loaded");
    setTimeout(() => {
      pagina.classList.remove("is-loading");
      loader.remove();
      aoEncerrar();
    }, TEMPO_REVELACAO);
  }, ATRASO_REVELACAO);
}

export function iniciarIntro(prepararPagina = () => {}) {
  if (!loader || !relogio || reduzirMovimento) {
    prepararPagina(true);
    pagina.classList.remove("is-loading");
    pagina.classList.add("is-loaded");
    loader?.remove();
    return Promise.resolve();
  }

  const tarefas = coletarCarregamentos();
  const total = tarefas.length;
  const inicio = performance.now();
  const horarioInicial = obterHorarioBrasilia();
  let concluidas = 0;
  let progressoExibido = 0;
  let inicioDaSaida = 0;
  let progressoInicialDaSaida = 0;
  let aguardouRecursos = false;

  tarefas.forEach((tarefa) => {
    tarefa.finally(() => {
      concluidas += 1;
    });
  });

  return new Promise((resolve) => {
    function atualizar(agora) {
      const tempo = agora - inicio;
      const recursosProntos = concluidas === total;
      const forcarSaida = tempo >= LIMITE_TOTAL;
      const tempoNormalizado = Math.min(1, tempo / TEMPO_ANIMACAO);
      const progressoNatural =
        tempoNormalizado * tempoNormalizado * (3 - 2 * tempoNormalizado);

      if (!recursosProntos && progressoNatural >= 0.94) {
        aguardouRecursos = true;
      }

      if (
        !inicioDaSaida &&
        ((aguardouRecursos && recursosProntos) || forcarSaida)
      ) {
        inicioDaSaida = agora;
        progressoInicialDaSaida = progressoExibido;
      }

      if (inicioDaSaida) {
        const progressoDaSaida = Math.min(
          1,
          (agora - inicioDaSaida) / TEMPO_FINAL_ATRASADO,
        );
        const curvaDaSaida =
          progressoDaSaida * progressoDaSaida * (3 - 2 * progressoDaSaida);
        progressoExibido =
          progressoInicialDaSaida +
          (1 - progressoInicialDaSaida) * curvaDaSaida;
      } else if (recursosProntos) {
        progressoExibido = progressoNatural;
      } else {
        progressoExibido = Math.min(progressoNatural, 0.94);
      }

      loader.style.setProperty(
        "--loader-progress",
        progressoExibido.toFixed(4),
      );
      atualizarRelogio(progressoExibido, inicio, agora, horarioInicial);

      if (progressoExibido >= 0.9999) {
        progressoExibido = 1;
        loader.style.setProperty("--loader-progress", "1");
        atualizarRelogio(1, inicio, agora, horarioInicial);
        encerrarIntro(resolve, prepararPagina);
        return;
      }

      requestAnimationFrame(atualizar);
    }

    requestAnimationFrame(atualizar);
  });
}

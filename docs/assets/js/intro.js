import { reduzirMovimento } from "./core.js";

const loader = document.getElementById("siteLoader");
const relogio = document.getElementById("loaderClock");
const TEMPO_MINIMO = 2000;
const LIMITE_TOTAL = 8000;
const TEMPO_FINAL = 580;
const ATRASO_REVELACAO = 260;
const TEMPO_REVELACAO = 1000;
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
    const timer = setTimeout(resolve, limite);
    Promise.resolve(promessa)
      .catch(() => undefined)
      .then((resultado) => {
        clearTimeout(timer);
        resolve(resultado);
      });
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
      new Promise((resolve) => addEventListener("load", resolve, { once: true })),
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
  const chegada = progresso * progresso * (3 - 2 * progresso);
  const horaFinal = horarioInicial.hora + segundosDecorridos / 120;
  const minutoFinal = horarioInicial.minuto + segundosDecorridos / 10;

  relogio.style.setProperty(
    "--clock-hour",
    `${(horaFinal - (1 - chegada) * 38).toFixed(3)}deg`,
  );
  relogio.style.setProperty(
    "--clock-minute",
    `${(minutoFinal - (1 - chegada) * 360).toFixed(3)}deg`,
  );
}

function encerrarIntro(aoEncerrar) {
  loader.classList.add("is-complete");

  setTimeout(() => {
    document.documentElement.classList.add("is-loaded");
    setTimeout(() => {
      document.documentElement.classList.remove("is-loading");
      loader.remove();
      aoEncerrar();
    }, TEMPO_REVELACAO);
  }, ATRASO_REVELACAO);
}

export function iniciarIntro() {
  if (!loader || !relogio || reduzirMovimento) {
    document.documentElement.classList.remove("is-loading");
    document.documentElement.classList.add("is-loaded");
    loader?.remove();
    return Promise.resolve();
  }

  const tarefas = coletarCarregamentos();
  const total = Math.max(1, tarefas.length);
  const inicio = performance.now();
  const horarioInicial = obterHorarioBrasilia();
  let concluidas = 0;
  let progressoExibido = 0;
  let quadroAnterior = inicio;
  let inicioDaSaida = 0;

  tarefas.forEach((tarefa) => {
    tarefa.finally(() => {
      concluidas += 1;
    });
  });

  return new Promise((resolve) => {
    function atualizar(agora) {
      const intervalo = Math.min(64, agora - quadroAnterior);
      const tempo = agora - inicio;
      const progressoReal = concluidas / total;
      const tempoMinimoCumprido = tempo >= TEMPO_MINIMO;
      const recursosProntos = concluidas === total;
      const forcarSaida = tempo >= LIMITE_TOTAL;

      if (
        !inicioDaSaida &&
        ((recursosProntos && tempoMinimoCumprido) || forcarSaida)
      )
        inicioDaSaida = agora;

      const progressoDeEspera = Math.min(1, tempo / TEMPO_MINIMO);
      const curvaDeEspera =
        progressoDeEspera * progressoDeEspera * (3 - 2 * progressoDeEspera);
      const alvo = inicioDaSaida
        ? 1
        : Math.min(
            0.92,
            progressoReal * (0.18 + curvaDeEspera * 0.68) +
              curvaDeEspera * 0.06,
          );
      const suavizacao = 1 - Math.exp(-intervalo / 360);
      progressoExibido += (alvo - progressoExibido) * suavizacao;

      if (inicioDaSaida && agora - inicioDaSaida >= TEMPO_FINAL)
        progressoExibido = 1;

      loader.style.setProperty(
        "--loader-progress",
        progressoExibido.toFixed(4),
      );
      atualizarRelogio(progressoExibido, inicio, agora, horarioInicial);

      if (progressoExibido >= 1) {
        encerrarIntro(resolve);
        return;
      }

      quadroAnterior = agora;
      requestAnimationFrame(atualizar);
    }

    requestAnimationFrame(atualizar);
  });
}

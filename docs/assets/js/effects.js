import { ehTouch, paginaVisivel, reduzirMovimento } from "./core.js";

function configurarCanvas(canvas, contexto) {
  const dpr = Math.min(devicePixelRatio || 1, 1.5);
  const largura = canvas.clientWidth || innerWidth;
  const altura = canvas.clientHeight || innerHeight;
  canvas.width = Math.round(largura * dpr);
  canvas.height = Math.round(altura * dpr);
  contexto.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { largura, altura };
}

function iniciarTickerStack() {
  const track = document.getElementById("stackTicker");
  const grupo = track?.querySelector(".ticker__group");
  if (
    !track ||
    !grupo ||
    reduzirMovimento ||
    ehTouch ||
    track.children.length > 1
  )
    return;
  const copia = grupo.cloneNode(true);
  copia.setAttribute("aria-hidden", "true");
  track.appendChild(copia);
  track.classList.add("is-running");
  track.closest(".ticker")?.classList.add("is-running");
}

async function iniciarDistorcaoAlbum() {
  const capa = document.querySelector(".hero__cover");
  const canvas = capa?.querySelector(".hero__cover-canvas");
  const imagemEscura = capa?.querySelector(".hero__cover-art--dark");
  const imagemClara = capa?.querySelector(".hero__cover-art--light");
  if (
    !capa ||
    !canvas ||
    !imagemEscura ||
    !imagemClara ||
    ehTouch ||
    reduzirMovimento
  )
    return;

  const gl = canvas.getContext("webgl", {
    alpha: false,
    antialias: false,
    powerPreference: "high-performance",
  });
  if (!gl) return;

  const vertexSource = `
    attribute vec2 aPosition;
    varying vec2 vUv;

    void main() {
      vUv = aPosition * 0.5 + 0.5;
      gl_Position = vec4(aPosition, 0.0, 1.0);
    }
  `;
  const fragmentSource = `
    precision mediump float;

    varying vec2 vUv;
    uniform sampler2D uDarkTexture;
    uniform sampler2D uLightTexture;
    uniform vec2 uMouse;
    uniform vec2 uVelocity;
    uniform float uStrength;
    uniform float uTime;
    uniform float uThemeMix;

    vec4 sampleTheme(vec2 uv) {
      vec2 safeUv = clamp(uv, vec2(0.002), vec2(0.998));
      return mix(
        texture2D(uDarkTexture, safeUv),
        texture2D(uLightTexture, safeUv),
        uThemeMix
      );
    }

    void main() {
      vec2 delta = vUv - uMouse;
      float distanceToMouse = length(delta);
      float influence = 1.0 - smoothstep(0.04, 0.58, distanceToMouse);
      vec2 direction = delta / max(distanceToMouse, 0.001);
      float speed = clamp(length(uVelocity) * 15.0, 0.0, 1.0);
      vec2 velocityDirection = uVelocity / max(length(uVelocity), 0.001);

      float radialWave = sin(distanceToMouse * 34.0 - uTime * 3.0);
      float liquidWave = sin(
        vUv.x * 13.0 + vUv.y * 17.0 + uTime * 1.45
      );
      vec2 fluidOffset = direction * radialWave * uStrength * 0.56;
      fluidOffset += velocityDirection * speed * uStrength * 0.82;
      fluidOffset += vec2(liquidWave, -liquidWave) * uStrength * 0.16;
      fluidOffset *= influence;

      vec2 displacedUv = vUv - fluidOffset;
      vec4 center = sampleTheme(displacedUv);
      float rgbAmount = (uStrength * 0.46 + speed * 0.006) * influence;
      vec2 rgbDirection = normalize(
        velocityDirection + direction * 0.34 + vec2(0.001)
      );
      vec4 redSample = sampleTheme(displacedUv - rgbDirection * rgbAmount);
      vec4 blueSample = sampleTheme(displacedUv + rgbDirection * rgbAmount);
      vec3 rgbSplit = vec3(redSample.r, center.g, blueSample.b);
      vec3 finalColor = mix(center.rgb, rgbSplit, 0.84 * influence);

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `;

  function criarShader(tipo, fonte) {
    const shader = gl.createShader(tipo);
    gl.shaderSource(shader, fonte);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  const vertexShader = criarShader(gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = criarShader(gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertexShader || !fragmentShader) return;

  const programa = gl.createProgram();
  gl.attachShader(programa, vertexShader);
  gl.attachShader(programa, fragmentShader);
  gl.linkProgram(programa);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);
  if (!gl.getProgramParameter(programa, gl.LINK_STATUS)) {
    gl.deleteProgram(programa);
    return;
  }

  await Promise.all(
    [imagemEscura, imagemClara].map((imagem) =>
      imagem.decode?.().catch(() => {}),
    ),
  );
  if (!imagemEscura.naturalWidth || !imagemClara.naturalWidth) return;

  if (document.fonts) {
    await Promise.all([
      document.fonts.load('650 112px "Inter Tight"'),
      document.fonts.load('600 34px "Inter Tight"'),
    ]).catch(() => {});
  }

  function criarComposicao(imagem) {
    const composicao = document.createElement("canvas");
    const tamanho = Math.max(imagem.naturalWidth, imagem.naturalHeight);
    const contexto = composicao.getContext("2d");
    const escala = tamanho / 1254;
    composicao.width = tamanho;
    composicao.height = tamanho;
    contexto.drawImage(imagem, 0, 0, tamanho, tamanho);

    contexto.save();
    contexto.font = `650 ${112 * escala}px "Inter Tight"`;
    contexto.fillStyle = "rgba(255, 255, 255, 0.76)";
    contexto.textBaseline = "top";
    contexto.shadowColor = "rgba(0, 0, 0, 0.62)";
    contexto.shadowBlur = 18 * escala;
    contexto.shadowOffsetY = 2 * escala;
    if ("letterSpacing" in contexto) {
      contexto.letterSpacing = `${4 * escala}px`;
    }
    contexto.fillText("PORTFOLIO", tamanho * 0.06, tamanho * 0.058);

    contexto.font = `600 ${34 * escala}px "Inter Tight"`;
    contexto.fillStyle = "rgba(255, 255, 255, 0.94)";
    contexto.textBaseline = "bottom";
    contexto.shadowBlur = 12 * escala;
    if ("letterSpacing" in contexto) {
      contexto.letterSpacing = `${5.5 * escala}px`;
    }
    contexto.fillText("IGOR IANSEN", tamanho * 0.06, tamanho * 0.942);
    contexto.restore();

    return composicao;
  }

  function criarTextura(imagem, unidade) {
    const textura = gl.createTexture();
    gl.activeTexture(unidade);
    gl.bindTexture(gl.TEXTURE_2D, textura);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      imagem,
    );
    return textura;
  }

  gl.useProgram(programa);
  criarTextura(criarComposicao(imagemEscura), gl.TEXTURE0);
  criarTextura(criarComposicao(imagemClara), gl.TEXTURE1);
  gl.uniform1i(gl.getUniformLocation(programa, "uDarkTexture"), 0);
  gl.uniform1i(gl.getUniformLocation(programa, "uLightTexture"), 1);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW,
  );
  const posicao = gl.getAttribLocation(programa, "aPosition");
  gl.enableVertexAttribArray(posicao);
  gl.vertexAttribPointer(posicao, 2, gl.FLOAT, false, 0, 0);

  const uniforms = {
    mouse: gl.getUniformLocation(programa, "uMouse"),
    velocity: gl.getUniformLocation(programa, "uVelocity"),
    strength: gl.getUniformLocation(programa, "uStrength"),
    time: gl.getUniformLocation(programa, "uTime"),
    themeMix: gl.getUniformLocation(programa, "uThemeMix"),
  };
  const mouse = { x: 0.5, y: 0.5 };
  const mouseAlvo = { x: 0.5, y: 0.5 };
  const velocidade = { x: 0, y: 0 };
  const velocidadeAlvo = { x: 0, y: 0 };
  let intensidade = 0;
  let impulso = 0;
  let dentro = false;
  let quadro = 0;
  let temaMix =
    document.documentElement.dataset.theme === "light" ? 1 : 0;
  let temaAlvo = temaMix;
  let ponteiroAnterior = null;

  function redimensionar() {
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    const largura = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const altura = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width === largura && canvas.height === altura) return;
    canvas.width = largura;
    canvas.height = altura;
    gl.viewport(0, 0, largura, altura);
  }

  function animar(tempo) {
    quadro = 0;
    redimensionar();
    mouse.x += (mouseAlvo.x - mouse.x) * 0.13;
    mouse.y += (mouseAlvo.y - mouse.y) * 0.13;
    velocidade.x += (velocidadeAlvo.x - velocidade.x) * 0.16;
    velocidade.y += (velocidadeAlvo.y - velocidade.y) * 0.16;
    velocidadeAlvo.x *= 0.84;
    velocidadeAlvo.y *= 0.84;
    impulso *= 0.88;
    const intensidadeAlvo = dentro ? Math.max(0.012, impulso) : impulso;
    intensidade += (intensidadeAlvo - intensidade) * (dentro ? 0.11 : 0.08);
    temaMix += (temaAlvo - temaMix) * 0.085;

    gl.uniform2f(uniforms.mouse, mouse.x, mouse.y);
    gl.uniform2f(uniforms.velocity, velocidade.x, velocidade.y);
    gl.uniform1f(uniforms.strength, intensidade);
    gl.uniform1f(uniforms.time, tempo * 0.001);
    gl.uniform1f(uniforms.themeMix, temaMix);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    if (
      dentro ||
      intensidade > 0.0004 ||
      Math.abs(temaAlvo - temaMix) > 0.002
    ) {
      solicitarAnimacao();
    }
  }

  function solicitarAnimacao() {
    if (!quadro) quadro = requestAnimationFrame(animar);
  }

  function atualizarPonteiro(evento) {
    const rect = capa.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (evento.clientX - rect.left) / rect.width));
    const y = 1 -
      Math.min(1, Math.max(0, (evento.clientY - rect.top) / rect.height));
    if (ponteiroAnterior) {
      velocidadeAlvo.x = x - ponteiroAnterior.x;
      velocidadeAlvo.y = y - ponteiroAnterior.y;
      const rapidez = Math.hypot(velocidadeAlvo.x, velocidadeAlvo.y);
      impulso = Math.min(0.046, Math.max(impulso, 0.012 + rapidez * 0.42));
    }
    ponteiroAnterior = { x, y };
    mouseAlvo.x = x;
    mouseAlvo.y = y;
  }

  capa.addEventListener("pointerenter", (evento) => {
    dentro = true;
    ponteiroAnterior = null;
    atualizarPonteiro(evento);
    impulso = 0.018;
    solicitarAnimacao();
  });
  capa.addEventListener("pointermove", atualizarPonteiro, { passive: true });
  capa.addEventListener("pointerleave", () => {
    dentro = false;
    ponteiroAnterior = null;
    impulso = 0;
    solicitarAnimacao();
  });
  addEventListener("themechange", (evento) => {
    temaAlvo = evento.detail?.theme === "light" ? 1 : 0;
    solicitarAnimacao();
  });
  addEventListener("resize", solicitarAnimacao, { passive: true });
  canvas.addEventListener("webglcontextlost", () => {
    capa.classList.remove("is-webgl-ready");
  });

  redimensionar();
  gl.uniform2f(uniforms.mouse, mouse.x, mouse.y);
  gl.uniform2f(uniforms.velocity, 0, 0);
  gl.uniform1f(uniforms.strength, 0);
  gl.uniform1f(uniforms.time, 0);
  gl.uniform1f(uniforms.themeMix, temaMix);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  capa.classList.add("is-webgl-ready");
}

function iniciarCursor() {
  const cursorCanvas = document.getElementById("cursorCanvas");
  if (!cursorCanvas || ehTouch || reduzirMovimento) return;
  const ctx = cursorCanvas.getContext("2d");
  if (!ctx) return;

  let rastro = [];
  let tamanho;
  let cursorX = 0;
  let cursorY = 0;
  let cursorAtivo = false;
  let cursorDentroDaPagina = false;
  let quadroPendente = false;
  let cursorRgb = "238, 233, 229";
  document.documentElement.classList.add("has-custom-cursor");

  function atualizarCorCursor() {
    cursorRgb = getComputedStyle(document.documentElement)
      .getPropertyValue("--cursor-rgb")
      .trim();
  }

  function limparCursor() {
    rastro = [];
    cursorAtivo = false;
    if (tamanho) ctx.clearRect(0, 0, tamanho.largura, tamanho.altura);
  }

  function configurar() {
    const estavaAtivo = cursorAtivo;
    tamanho = configurarCanvas(cursorCanvas, ctx);
    rastro = [];
    cursorAtivo = estavaAtivo;
  }

  function solicitarDesenho() {
    if (quadroPendente) return;
    quadroPendente = true;
    requestAnimationFrame(desenhar);
  }

  addEventListener(
    "pointermove",
    (evento) => {
      cursorX = evento.clientX;
      cursorY = evento.clientY;
      cursorAtivo = true;
      cursorDentroDaPagina = true;
      const ultimo = rastro.at(-1);
      if (
        !ultimo ||
        Math.hypot(evento.clientX - ultimo.x, evento.clientY - ultimo.y) > 4
      ) {
        rastro.push({ x: evento.clientX, y: evento.clientY, vida: 1 });
        if (rastro.length > 32) rastro.shift();
      } else {
        ultimo.x = evento.clientX;
        ultimo.y = evento.clientY;
        ultimo.vida = 1;
      }
      solicitarDesenho();
    },
    { passive: true },
  );
  document.documentElement.addEventListener("mouseleave", () => {
    cursorDentroDaPagina = false;
    limparCursor();
  });
  document.documentElement.addEventListener("mouseenter", (evento) => {
    cursorX = evento.clientX;
    cursorY = evento.clientY;
    cursorAtivo = true;
    cursorDentroDaPagina = true;
    solicitarDesenho();
  });
  addEventListener("blur", limparCursor);
  addEventListener("focus", () => {
    if (!cursorDentroDaPagina) return;
    cursorAtivo = true;
    solicitarDesenho();
  });

  function criarCaminhoDoRastro() {
    ctx.beginPath();
    ctx.moveTo(rastro[0].x, rastro[0].y);
    for (let indice = 1; indice < rastro.length - 1; indice += 1) {
      const atual = rastro[indice];
      const proximo = rastro[indice + 1];
      ctx.quadraticCurveTo(
        atual.x,
        atual.y,
        (atual.x + proximo.x) / 2,
        (atual.y + proximo.y) / 2,
      );
    }
    const ultimo = rastro.at(-1);
    ctx.lineTo(ultimo.x, ultimo.y);
  }

  function desenharRastro() {
    if (rastro.length < 2) return;
    const primeiro = rastro[0];
    const ultimo = rastro.at(-1);
    const atividade =
      rastro.reduce((soma, ponto) => soma + ponto.vida, 0) / rastro.length;
    const gradiente = ctx.createLinearGradient(
      primeiro.x,
      primeiro.y,
      ultimo.x,
      ultimo.y,
    );
    gradiente.addColorStop(0, `rgba(${cursorRgb},0)`);
    gradiente.addColorStop(0.35, `rgba(${cursorRgb},${atividade * 0.16})`);
    gradiente.addColorStop(1, `rgba(${cursorRgb},${atividade * 0.62})`);

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    criarCaminhoDoRastro();
    ctx.strokeStyle = gradiente;
    ctx.lineWidth = 5;
    ctx.shadowColor = `rgba(${cursorRgb},.2)`;
    ctx.shadowBlur = 9;
    ctx.stroke();
    criarCaminhoDoRastro();
    ctx.lineWidth = 1.15;
    ctx.shadowBlur = 0;
    ctx.stroke();
    ctx.restore();
  }

  function desenharCursor() {
    if (!cursorAtivo) return;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cursorX, cursorY, 2, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${cursorRgb},0.92)`;
    ctx.shadowColor = "rgba(184, 50, 66, 0.5)";
    ctx.shadowBlur = 5;
    ctx.fill();
    ctx.restore();
  }

  function desenhar() {
    quadroPendente = false;
    ctx.clearRect(0, 0, tamanho.largura, tamanho.altura);
    if (!paginaVisivel) {
      rastro = [];
      return;
    }
    desenharRastro();
    desenharCursor();
    rastro.forEach((ponto) => {
      ponto.vida -= 0.026;
    });
    rastro = rastro.filter((ponto) => ponto.vida > 0);
    if (rastro.length) solicitarDesenho();
  }

  addEventListener(
    "resize",
    () => {
      configurar();
      solicitarDesenho();
    },
    { passive: true },
  );
  addEventListener("themechange", () => {
    atualizarCorCursor();
    solicitarDesenho();
  });
  atualizarCorCursor();
  configurar();
}

export function prepararEfeitos() {
  iniciarTickerStack();
}

export async function iniciarEfeitosInterativos() {
  iniciarCursor();
  await iniciarDistorcaoAlbum();
}

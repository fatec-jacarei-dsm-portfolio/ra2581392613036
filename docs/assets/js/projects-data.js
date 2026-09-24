export const projetos = [
  {
    categoria: "academico",
    nome: "Scrum Dungeon",
    descricao: {
      pt: "Um RPG educativo que transforma as práticas do Scrum em cinco níveis de desafios. O projeto foi desenvolvido em equipe pela Octopus Code.",
      en: "An educational RPG that turns Scrum practices into five levels of challenges. It was built as a team project by Octopus Code.",
    },
    contribuicao: {
      pt: "Fiquei responsável pelas mecânicas de progressão do personagem e pela integração dessa evolução com as sprints do jogo.",
      en: "I was responsible for the character progression mechanics and for connecting that progression to the game's sprints.",
    },
    tecnologias: [
      "HTML5",
      "CSS3",
      "JavaScript",
      "EJS",
      "Node.js",
      "Express",
      "PostgreSQL",
      "Git Flow",
      "Figma",
    ],
    repo: "https://github.com/octopusCode26/scrum-dungeon",
    semestre: { pt: "1DSM — 1º Sem. 2026", en: "1DSM — 1st Sem. 2026" },
    imagem: "assets/media/scrum-dungeon/cover.jpg",
    imagemLargura: 1200,
    imagemAltura: 800,
    video: "assets/media/scrum-dungeon/demo.mp4",
    velocidadeVideo: 1.5,
  },
  {
    emBreve: true,
    faixa: 2,
    nome: { pt: "Em breve", en: "Coming soon" },
    status: { pt: "Não lançado", en: "Unreleased" },
    lancamento: { pt: "Faixa 02", en: "Track 02" },
    descricao: {
      pt: "Algumas faixas ainda não têm nome.",
      en: "Some tracks do not have a name yet.",
    },
  },
];

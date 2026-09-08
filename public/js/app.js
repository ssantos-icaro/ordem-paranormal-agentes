"use strict";

/* ============================================================
   ORDEM PARANORMAL RPG 2 — Criador de Agentes
   Regras reconstruídas pela comunidade (@SkStatic_) a partir do
   playtest alpha "A Maldição do Ídolo de Pedra". Não-oficial.
   ============================================================ */

/* ---------------- Constantes do sistema ---------------- */
const DIE_STEPS = [4, 6, 8, 10, 12, 20];

function stepDie(value, delta) {
  const i = DIE_STEPS.indexOf(value);
  if (i === -1) return value;
  const next = Math.min(DIE_STEPS.length - 1, Math.max(0, i + delta));
  return DIE_STEPS[next];
}
function dieLabel(v) {
  return "d" + v;
}

const ATTR_LABEL = { fisico: "Físico", mente: "Mente", emocao: "Emoção" };
const ATTR_ADJ = { fisico: "físico", mente: "mental", emocao: "emocional" };

const SKILL_DEFS = [
  { name: "Acrobacia", attr: "fisico" },
  { name: "Aptidão", attr: "mente" },
  { name: "Atletismo", attr: "fisico" },
  { name: "Crime", attr: "fisico" },
  { name: "Disciplina", attr: "emocao" },
  { name: "Enganação", attr: "emocao" },
  { name: "Furtividade", attr: "fisico" },
  { name: "Intimidar", attr: "emocao" },
  { name: "Intuição", attr: "emocao" },
  { name: "Luta", attr: "fisico" },
  { name: "Máquinas", attr: "mente" },
  { name: "Medicina", attr: "mente" },
  { name: "Ocultismo", attr: "mente" },
  { name: "Percepção", attr: "mente" },
  { name: "Persuasão", attr: "emocao" },
  { name: "Pesquisar", attr: "mente" },
  { name: "Pontaria", attr: "fisico" },
  { name: "Sobrevivência", attr: "mente" },
  { name: "Tecnologia", attr: "mente" },
  { name: "Vigor", attr: "fisico" },
];

const PROFILES = {
  Executor: {
    icon: "⚔",
    theme: "red",
    desc: "Age primeiro e lida bem com a pressão. Especialista em conflito e ação direta.",
    ability: {
      title: "Ímpeto",
      text: "Você possui uma barra de Ímpeto com três espaços. Sempre que falha em um teste, preenche um espaço. Pode apagar espaços para: (1 espaço) receber +1d4 em um teste; (3 espaços) aumentar um atributo em um passo até o fim da cena.",
    },
  },
  Analista: {
    icon: "◈",
    theme: "blue",
    desc: "Foca em observação, preparo e precisão nas ações. O cérebro da investigação.",
    ability: {
      title: "Avaliação",
      text: "Você pode gastar uma ação e 2 PD para observar um ser ou ambiente. Recebe dois dados bônus que pode usar em testes relativos àquele alvo (juntos ou separados, +1d4 cada). Não acumula mais de dois dados por esta habilidade.",
    },
  },
  Vigilante: {
    icon: "☽",
    theme: "green",
    desc: "Fica atento ao ambiente e reage rapidamente às ameaças. Nunca é pego de surpresa.",
    ability: {
      title: "Prontidão",
      text: "No início de qualquer conflito, você pode gastar 3 PD. Se fizer isso, ganha uma rodada na qual pode agir antes dos demais personagens e NPCs.",
    },
  },
};

const OCCUPATIONS = [
  {
    name: "Profissional de Escritório",
    ability: {
      name: "Conhecimento Técnico",
      text: "Você possui uma perícia mental aumentada para d6.",
      kind: "passive",
      bonus: { attr: "mente" },
    },
  },
  {
    name: "Professor",
    ability: {
      name: "Mentoria",
      text: "Quando ajuda outro personagem, você pode fazer um teste da perícia que usou para ajudar contra DT 7. Se passar, o personagem ajudado pode substituir um dos dados rolados por ele pela sua rolagem alta.",
      kind: "mentoria",
    },
  },
  {
    name: "Cientista",
    ability: {
      name: "Foco mental",
      text: "Quando faz um teste mental, você pode gastar 2 PD para receber +1d4 no teste.",
      kind: "focus",
      focus: "mente",
    },
  },
  {
    name: "Operário",
    ability: {
      name: "Esforço e suor",
      text: "Você possui uma perícia física aumentada para d6.",
      kind: "passive",
      bonus: { attr: "fisico" },
    },
  },
  {
    name: "Artista",
    ability: {
      name: "Foco emocional",
      text: "Quando faz um teste emocional, você pode gastar 2 PD para receber +1d4 no teste.",
      kind: "focus",
      focus: "emocao",
    },
  },
  {
    name: "Médico",
    ability: {
      name: "Técnica Medicinal",
      text: "Quando faz um teste emocional, você pode gastar 2 PD para receber +1d4 no teste.",
      kind: "focus",
      focus: "emocao",
    },
  },
  {
    name: "Policial",
    ability: {
      name: "Incansável",
      text: "Uma vez por cena de conflito, você pode gastar 5 PV para fazer uma ação extra.",
      kind: "acaoExtra",
    },
  },
];

const CRIT_FAIL_TABLE = [
  {
    roll: 1,
    name: "Vexame",
    text: "Descreva a ação de forma vergonhosa. Sem efeito de regra, além da falha.",
  },
  {
    roll: 2,
    name: "Machucado",
    text: "Físico diminui um passo até o fim da cena.",
    attr: "fisico",
  },
  {
    roll: 3,
    name: "Desatenção",
    text: "Mente diminui um passo até o fim da cena.",
    attr: "mente",
  },
  {
    roll: 4,
    name: "Irritação",
    text: "Emoção diminui um passo até o fim da cena.",
    attr: "emocao",
  },
  { roll: 5, name: "Acidente", text: "Perde 1d4 PV.", pv: true },
  { roll: 6, name: "Frustração", text: "Perde 1d4 PD.", pd: true },
  { roll: 7, name: "Perda", text: "Um item carregado se perde.", item: true },
  { roll: 8, name: "Nenhum efeito adicional", text: "" },
];

const SYMBOLS = ["◉", "☰", "△", "⬡", "◈", "✶", "☾", "☗", "❖", "✚"];

const FIRST_NAMES = [
  "Bianca",
  "Caio",
  "Diana",
  "Elias",
  "Fabiana",
  "Gustavo",
  "Helena",
  "Igor",
  "Júlia",
  "Kleber",
  "Lucas",
  "Marina",
  "Nando",
  "Otávia",
  "Paulo",
  "Renata",
  "Sérgio",
  "Tânia",
  "Ulisses",
  "Vera",
];
const LAST_NAMES = [
  "Aguiar",
  "Barreto",
  "Cordeiro",
  "Dantas",
  "Esteves",
  "Farias",
  "Guimarães",
  "Hortêncio",
  "Ibrahim",
  "Junqueira",
  "Klein",
  "Lacerda",
  "Mafra",
  "Nogueira",
  "Orsini",
  "Pimentel",
  "Quintana",
  "Ribas",
  "Salgado",
  "Teixeira",
];

/* ---------------- Estado ---------------- */
const AUTH_KEY = "op2_token";
let currentUser = null;
let agents = [];

function getToken() {
  return localStorage.getItem(AUTH_KEY) || "";
}

/* ---------------- API ---------------- */
async function api(path, opts) {
  opts = opts || {};
  opts.headers = Object.assign(
    { "Content-Type": "application/json" },
    opts.headers || {},
  );
  const token = getToken();
  if (token) opts.headers.Authorization = "Bearer " + token;
  const res = await fetch(path, opts);
  if (res.status === 401) {
    doLogout();
    throw new Error("Sessão expirada. Faça login novamente.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Erro no servidor.");
  return data;
}

function apiGet(path) {
  return api(path);
}
function apiPut(path, body) {
  return api(path, { method: "PUT", body: JSON.stringify(body) });
}
function apiDelete(path) {
  return api(path, { method: "DELETE" });
}

let draft = {
  name: "",
  age: "",
  concept: "",
  symbol: "✶",
  attrs: { fisico: 6, mente: 6, emocao: 6 },
  profile: null,
  occupation: null,
  level: 2,
  skills: {},
  pvAlloc: null,
  pdAlloc: null,
  notes: "",
  inventory: [],
};

const STEPS = [
  { id: "identidade", label: "Identidade" },
  { id: "atributos", label: "Atributos" },
  { id: "nivel", label: "Nível" },
  { id: "perfil", label: "Perfil" },
  { id: "ocupacao", label: "Ocupação" },
  { id: "pericias", label: "Perícias" },
  { id: "vital", label: "PV & PD" },
];
let stepIndex = 0;
let selectedSkill = null;
let pendingBonusDice = [];
let currentAgent = null;

/* ---------------- Ajudantes ---------------- */
function esc(s) {
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function rollDie(sides) {
  return 1 + Math.floor(Math.random() * sides);
}

function performTest(dice, dt) {
  const rolled = dice.map((d) => ({ ...d, value: rollDie(d.sides) }));
  let counted = rolled,
    dropped = [];
  if (rolled.length > 3) {
    const sorted = [...rolled].sort((a, b) => b.value - a.value);
    counted = sorted.slice(0, 3);
    dropped = sorted.slice(3);
  }
  const total = counted.reduce((s, d) => s + d.value, 0);
  const values = counted.map((d) => d.value);
  const ra = Math.max(...values);
  const rb = Math.min(...values);
  const vc = {};
  values.forEach((v) => {
    vc[v] = (vc[v] || 0) + 1;
  });
  const criticalSuccess = Object.entries(vc).some(
    ([v, c]) => Number(v) >= 6 && c >= 2,
  );
  const criticalFail = values.length >= 2 && values.every((v) => v === 1);
  const passed =
    dt === null || dt === undefined || dt === "" ? null : total >= dt;
  return {
    rolled,
    counted,
    dropped,
    total,
    ra,
    rb,
    criticalSuccess,
    criticalFail,
    critRoll: criticalFail ? rollDie(8) : null,
    critApplied: false,
    passed,
    dt: dt ?? null,
  };
}

/* ---------------- API de agentes (servidor) ---------------- */
function saveAgent(a) {
  putAgent(a);
}
async function putAgent(a) {
  try {
    await apiPut("/api/agents/" + encodeURIComponent(a.id), a);
  } catch (e) {
    if (!(e instanceof Error && /expirou|login/i.test(e.message))) toast(e.message);
  }
}

/* ---------------- Navegação de telas ---------------- */
function showScreen(id) {
  document
    .querySelectorAll(".screen")
    .forEach((s) => s.classList.remove("active"));
  document.getElementById("screen-" + id).classList.add("active");
  window.scrollTo(0, 0);
  if (id === "home") renderHome();
  if (id === "create") renderWizard();
}

/* ---------------- HOME ---------------- */
function avatarMarkup(a, extraClass) {
  const p = PROFILES[a.profile] || {};
  const cls =
    "avatar theme-" + (p.theme || "green") + (a.photo ? " photo" : "") + (extraClass ? " " + extraClass : "");
  return a.photo
    ? `<div class="${cls}" style="background-image:url('${a.photo}')" role="img" aria-label="${esc(a.name || "")}"></div>`
    : `<div class="${cls}">${esc(a.symbol || "✶")}</div>`;
}

function renderHome() {
  const list = document.getElementById("agentList");
  list.classList.toggle("empty", agents.length === 0);
  list.innerHTML = agents.length
    ? ""
    : `
    <div class="card" style="text-align:center;grid-column:1/-1">
      Nenhum agente ainda. Toque em <b>Criar novo agente</b> para montar sua ficha.
    </div>`;
  agents.forEach((a) => {
    const card = document.createElement("div");
    card.className = "agent-card";
    card.innerHTML = `
      <button class="ac-del" title="Excluir">✕</button>
      <div class="ac-top">
        ${avatarMarkup(a)}
        <div>
          <div class="ac-name">${esc(a.name || "Sem nome")}</div>
          <div class="ac-meta">${esc(a.profile || "")} · ${esc(a.occupation || "")} · Nível ${a.level}</div>
        </div>
      </div>
      <div class="ac-bar">
        <span>PV ${a.pv_current}/${a.pv_max}</span>
        <span>PD ${a.pd_current}/${a.pd_max}</span>
      </div>`;
    card.querySelector(".ac-del").addEventListener("click", (e) => {
      e.stopPropagation();
      confirmModal("Excluir agente?", `"${a.name}" será apagado permanentemente.`, async () => {
        await apiDelete("/api/agents/" + encodeURIComponent(a.id));
        agents = agents.filter((x) => x.id !== a.id);
        renderHome();
      });
    });
    card.addEventListener("click", () => openSheet(a.id));
    list.appendChild(card);
  });
}

/* ---------------- WIZARD ---------------- */
function renderWizard() {
  const sl = document.getElementById("stepList");
  sl.innerHTML = "";
  STEPS.forEach((st, i) => {
    const li = document.createElement("li");
    li.dataset.i = i;
    li.textContent = st.label;
    li.classList.toggle("active", i === stepIndex);
    li.classList.toggle("done", i < stepIndex);
    li.addEventListener("click", () => {
      stepIndex = i;
      renderWizard();
    });
    sl.appendChild(li);
  });

  const panels = document.getElementById("stepPanels");
  panels.innerHTML = "";
  STEPS.forEach((st, i) => panels.appendChild(buildStep(i)));
  updateRuleSummary();

  document.getElementById("stepCounter").textContent =
    `${String(stepIndex + 1).padStart(2, "0")} / ${String(STEPS.length).padStart(2, "0")}`;
  document.getElementById("btnPrev").disabled = stepIndex === 0;
  document.getElementById("btnNext").textContent =
    stepIndex === STEPS.length - 1 ? "Concluir ficha →" : "Próximo →";
}

function buildStep(i) {
  const div = document.createElement("div");
  div.className = "step-panel" + (i === stepIndex ? " active" : "");
  const id = STEPS[i].id;
  const crate = {
    identidade: buildIdentidade,
    atributos: buildAtributos,
    nivel: buildNivel,
    perfil: buildPerfil,
    ocupacao: buildOcupacao,
    pericias: buildPericias,
    vital: buildVital,
  }[id];
  if (crate) crate(div);
  return div;
}

/* --- 1. Identidade --- */
function buildIdentidade(div) {
  div.innerHTML = `
    <h2 class="step-title">Identidade</h2>
    <p class="step-sub">Quem é essa pessoa? Dê nome e um motivo para ter cruzado com o Outro Lado.</p>
    <div class="field">
      <label>Nome</label>
      <input type="text" id="inName" class="input" value="${esc(draft.name)}" placeholder="Nome do agente" maxlength="40">
      <button class="btn ghost small" id="btnRandomName" style="margin-top:8px">Sortear nome</button>
    </div>
    <div class="field-row">
      <div class="field">
        <label>Idade</label>
        <input type="text" id="inAge" class="input" value="${esc(draft.age)}" placeholder="ex.: 28 anos" maxlength="20">
      </div>
      <div class="field">
        <label>Símbolo</label>
        <div class="symbol-picker" id="symbolPicker" style="display:flex;gap:8px;flex-wrap:wrap"></div>
      </div>
    </div>
    <div class="field">
      <label>Conceito (resuma em uma frase)</label>
      <textarea id="inConcept" class="input" rows="2" placeholder='ex.: "Uma ex-policial que ainda espera por justiça."'>${esc(draft.concept)}</textarea>
    </div>`;
  div.querySelector("#btnRandomName").addEventListener("click", () => {
    const n = pick(FIRST_NAMES) + " " + pick(LAST_NAMES);
    draft.name = n;
    div.querySelector("#inName").value = n;
  });
  div.querySelector("#inName").addEventListener("input", (e) => {
    draft.name = e.target.value;
  });
  div.querySelector("#inAge").addEventListener("input", (e) => {
    draft.age = e.target.value;
  });
  div.querySelector("#inConcept").addEventListener("input", (e) => {
    draft.concept = e.target.value;
  });

  const sp = div.querySelector("#symbolPicker");
  SYMBOLS.forEach((sym) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "a-step";
    b.style.cssText = "width:38px;height:38px;font-size:18px";
    b.textContent = sym;
    if (draft.symbol === sym) {
      b.style.borderColor = "var(--blood)";
      b.style.color = "var(--blood)";
    }
    b.addEventListener("click", () => {
      draft.symbol = sym;
      renderWizard();
    });
    sp.appendChild(b);
  });
}

/* --- 2. Atributos --- */
function attrBudget() {
  const base = DIE_STEPS.indexOf(6);
  const stepAbove = (k) => Math.max(0, DIE_STEPS.indexOf(draft.attrs[k]) - base);
  const d4count = ["fisico", "mente", "emocao"].filter((k) => draft.attrs[k] === 4).length;
  const raises = stepAbove("fisico") + stepAbove("mente") + stepAbove("emocao");
  const lowers = d4count >= 1 ? 1 : 0;
  return { used: raises, budget: 2 + lowers, remaining: 2 + lowers - raises, d4count };
}

function buildAtributos(div) {
  const b = attrBudget();
  div.innerHTML = `
    <h2 class="step-title">Atributos</h2>
    <p class="step-sub">Todos os atributos começam em <b>d6</b>. Um <b>ponto</b> sobe um atributo em um passo (d6 → d8 custa <b>1 ponto</b>, não 2). Você pode reduzir <b>exatamente um</b> atributo para <b>d4</b> e ganhar +1 ponto.</p>
    <div class="attr-editor">
      ${["fisico", "mente", "emocao"]
        .map(
          (a) => `
        <div class="attr-box">
          <div class="a-name">${ATTR_LABEL[a]}</div>
          <div class="a-tag">${a === "fisico" ? "PV" : a === "emocao" ? "PD" : "Pontos de perícia"}</div>
          <span class="a-die">${dieLabel(draft.attrs[a])}</span>
          <div class="a-controls">
            <button class="a-step" data-attr="${a}" data-d="-1">−</button>
            <button class="a-step" data-attr="${a}" data-d="1">+</button>
          </div>
        </div>`,
        )
        .join("")}
    </div>
    <div class="budget-bar">
      <span class="budget-n ${b.remaining === 0 ? "ok" : ""}">${b.remaining} pts</span>
      <small>restantes &middot; gastos <b>${b.used}</b> de <b>${b.budget}</b>${b.d4count ? " &middot; redução a d4: <b>+1 ponto</b>" : ""} &middot; máximo na criação: <b>d10</b></small>
    </div>`;
  div.querySelectorAll(".a-step").forEach((btn) => {
    btn.addEventListener("click", () => {
      const attr = btn.dataset.attr;
      const d = Number(btn.dataset.d);
      const cur = draft.attrs[attr];
      let next;
      if (d > 0) {
        if (attrBudget().remaining <= 0) return;
        next = stepDie(cur, 1);
        if (next > 10) return;
      } else {
        next = stepDie(cur, -1);
        if (next < 4) return;
        if (cur !== 4 && next === 4 && attrBudget().d4count >= 1) {
          toast("Apenas um atributo pode ser reduzido a d4.");
          return;
        }
      }
      draft.attrs[attr] = next;
      renderWizard();
    });
  });
}

/* --- 3. Nível --- */
function skillCap(level) {
  if (level >= 6) return 12;
  if (level >= 4) return 10;
  if (level >= 2) return 8;
  return 6;
}
const VITAL_POOL = () => draft.level * 6;

function buildNivel(div) {
  const maxSkill = skillCap(draft.level);
  div.innerHTML = `
    <h2 class="step-title">Nível</h2>
    <p class="step-sub">Separação de Nível (1 a 10) e NEX. O nível define suas perícias máximas e seu poço de PV/PD.</p>
    <div class="field">
      <label>Nível (1 a 10)</label>
      <select id="inLevel" class="input">
        ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((l) => `<option value="${l}" ${l === draft.level ? "selected" : ""}>Nível ${l}</option>`).join("")}
      </select>
    </div>
    <div class="rule-summary" style="margin-top:0">
      <b>Perícia máxima:</b> d${maxSkill} &nbsp;·&nbsp; <b>Poço de PV/PD:</b> ${draft.level * 6} pontos
      &nbsp;·&nbsp; <b>d8</b> (nível 2+) · <b>d10</b> (nível 4+) · <b>d12</b> (nível 6+)
    </div>`;
  div.querySelector("#inLevel").addEventListener("change", (e) => {
    draft.level = Number(e.target.value);
    SKILL_DEFS.forEach((s) => {
      if (draft.skills[s.name] > skillCap(draft.level))
        draft.skills[s.name] = skillCap(draft.level);
    });
    renderWizard();
  });
}

/* --- 4. Perfil --- */
function buildPerfil(div) {
  div.innerHTML = `
    <h2 class="step-title">Perfil</h2>
    <p class="step-sub">Como seu personagem resolve problemas? Cada perfil concede uma habilidade única.</p>
    <div class="choice-grid">
      ${["Executor", "Analista", "Vigilante"]
        .map((p) => {
          const pr = PROFILES[p];
          return `
        <div class="choice-card ${draft.profile === p ? "selected" : ""}" data-p="${p}">
          <span class="cc-tag">${pr.icon} PERFIL</span>
          <h4>${p}</h4>
          <p>${pr.desc}</p>
          <p style="margin-top:8px;color:var(--ink)"><b>${pr.ability.title}:</b> ${pr.ability.text}</p>
        </div>`;
        })
        .join("")}
    </div>`;
  div.querySelectorAll(".choice-card").forEach((c) => {
    c.addEventListener("click", () => {
      draft.profile = c.dataset.p;
      renderWizard();
    });
  });
}

/* --- 5. Ocupação --- */
function buildOcupacao(div) {
  div.innerHTML = `
    <h2 class="step-title">Ocupação</h2>
    <p class="step-sub">Sua vida antes (e depois) da Ordem. Cada ocupação concede uma habilidade única, passiva ou ativa.</p>
    <div class="choice-grid">
      ${OCCUPATIONS.map(
        (o) => `
        <div class="choice-card ${draft.occupation === o.name ? "selected" : ""}" data-o="${o.name}">
          <span class="cc-tag">OCUPAÇÃO · ${o.ability.kind === "passive" ? "HABILIDADE PASSIVA" : "HABILIDADE ATIVA"}</span>
          <h4>${o.name}</h4>
          <p style="margin-top:8px;color:var(--ink)"><b>${esc(o.ability.name)}:</b> ${esc(o.ability.text)}</p>
        </div>`,
      ).join("")}
    </div>`;
  div.querySelectorAll(".choice-card").forEach((c) => {
    c.addEventListener("click", () => {
      draft.occupation = c.dataset.o;
      renderWizard();
    });
  });
}

/* --- 6. Perícias --- */
function occSkillBonus() {
  const o = OCCUPATIONS.find((x) => x.name === draft.occupation);
  return o && o.ability.bonus;
}
function skillPool() {
  return draft.attrs.mente + (occSkillBonus() ? 1 : 0);
}
function skillUsed() {
  return Object.values(draft.skills).reduce(
    (s, die) => s + (DIE_STEPS.indexOf(die) - DIE_STEPS.indexOf(4)),
    0,
  );
}

function buildPericias(div) {
  const pool = skillPool();
  const used = skillUsed();
  const cap = skillCap(draft.level);
  const bonus = occSkillBonus();
  const occ = OCCUPATIONS.find((o) => o.name === draft.occupation);
  div.innerHTML = `
    <h2 class="step-title">Perícias</h2>
    <p class="step-sub">Pontos = <b>máximo da Mente</b> (d${draft.attrs.mente} → ${draft.attrs.mente} pontos)${
      bonus
        ? ` · <b style="color:var(--gold)">+1 ponto da ${esc(occ.ability.name)}</b> (só perícias ${ATTR_ADJ[bonus.attr]})`
        : ""
    }. Cada ponto eleva a perícia um passo (d4 → d6 → …). Teto no nível ${draft.level}: <b>d${cap}</b>.</p>
    <div class="skill-pool">
      <span class="pool-n" style="${used > pool ? "color:var(--red)" : ""}">${used}/${pool}</span>
      <small>pontos gastos / disponíveis ${used > pool ? '· <b style="color:var(--red)">excedeu!</b>' : ""}</small>
    </div>
    <div class="skill-editor">
      ${SKILL_DEFS.map((s) => {
        const die = draft.skills[s.name] || 4;
        const overcapped = die > cap;
        return `
        <div class="skill-row">
          <button class="sn" data-sk="${s.name}" data-d="-1">−</button>
          <div style="flex:1">
            <div class="s-name">${s.name}</div>
            <div class="sattr">${ATTR_LABEL[s.attr]}</div>
          </div>
          <button class="sn" data-sk="${s.name}" data-d="1">+</button>
          <span class="s-die ${overcapped ? "capped" : ""}">d${die}</span>
        </div>`;
      }).join("")}
    </div>`;
  div.querySelectorAll(".sn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const name = btn.dataset.sk;
      const d = Number(btn.dataset.d);
      const cur = draft.skills[name] || 4;
      if (d > 0) {
        if (used >= pool) {
          toast("Sem pontos de perícia suficientes.");
          return;
        }
        const sdef = SKILL_DEFS.find((s) => s.name === name);
        if (bonus && used >= draft.attrs.mente && sdef && sdef.attr !== bonus.attr) {
          toast(`O ponto extra de ${occ.ability.name} só vale em perícias ${ATTR_ADJ[bonus.attr]}.`);
          return;
        }
        const next = stepDie(cur, 1);
        if (next > cap) {
          toast(`Teto de d${cap} para o nível ${draft.level}.`);
          return;
        }
        draft.skills[name] = next;
      } else {
        if (cur <= 4) return;
        draft.skills[name] = stepDie(cur, -1);
        if (draft.skills[name] === 4) delete draft.skills[name];
      }
      renderWizard();
    });
  });
}

/* --- 7. PV & PD --- */
function buildVital(div) {
  if (draft.pvAlloc === null || draft.pdAlloc === null) {
    draft.pvAlloc = Math.floor(VITAL_POOL() / 2);
    draft.pdAlloc = VITAL_POOL() - draft.pvAlloc;
  }
  const pool = VITAL_POOL();
  const pvMax = draft.attrs.fisico + draft.pvAlloc;
  const pdMax = draft.attrs.emocao + draft.pdAlloc;
  div.innerHTML = `
    <h2 class="step-title">Vitalidade — PV & PD</h2>
    <p class="step-sub"><b>PV</b> começa no máximo do seu Físico (d${draft.attrs.fisico}); <b>PD</b> no máximo da sua Emoção (d${draft.attrs.emocao}). Distribua o poço de <b>${pool} pontos</b> do nível ${draft.level} entre as duas.</p>
    <div class="pvpd">
      <div class="pv-box">
        <div class="b-title">PONTOS DE VIDA (PV)</div>
        <div class="b-total">${pvMax}</div>
        <small>Físico d${draft.attrs.fisico} + ${draft.pvAlloc} alocados</small>
      </div>
      <div class="pd-box">
        <div class="b-title">PONTOS DE DETERMINAÇÃO (PD)</div>
        <div class="b-total">${pdMax}</div>
        <small>Emoção d${draft.attrs.emocao} + ${draft.pdAlloc} alocados</small>
      </div>
    </div>
    <div class="range-wrap">
      <label style="font-family:var(--font-display);font-size:12px;letter-spacing:.18em;color:var(--gold);display:block;margin-bottom:8px">Para onde vai o poço?</label>
      <input type="range" id="pvSlider" min="0" max="${pool}" value="${draft.pvAlloc}" step="1">
      <div class="range-labels">
        <span>PV: ${draft.pvAlloc} (total ${pvMax})</span>
        <span>PD: ${draft.pdAlloc} (total ${pdMax})</span>
      </div>
    </div>`;
  div.querySelector("#pvSlider").addEventListener("input", (e) => {
    draft.pvAlloc = Number(e.target.value);
    draft.pdAlloc = pool - draft.pvAlloc;
    renderWizard();
  });
}

/* ---------------- Resumo de regras (sidebar) ---------------- */
function updateRuleSummary() {
  const el = document.getElementById("ruleSummary");
  if (!el) return;
  const step = STEPS[stepIndex];
  if (!step) return;
  let html = "";
  switch (step.id) {
    case "atributos": {
      const b = attrBudget();
      html = `<b>Atributos:</b> ${b.used}/${b.budget} pts usados. Máximo na criação: d10.`;
      break;
    }
    case "nivel":
      html = `<b>Nível:</b> teto de perícia d${skillCap(draft.level)} · poço de vital ${draft.level * 6} pts.`;
      break;
    case "perfil":
      html = `<b>Perfil:</b> Executor (Ímpeto) · Analista (Avaliação) · Vigilante (Prontidão).`;
      break;
    case "ocupacao":
      html = `<b>Ocupação:</b> cada uma concede uma habilidade única (passiva ou ativa).`;
      break;
    case "pericias": {
      const used = skillUsed();
      html = `<b>Perícias:</b> ${used}/${skillPool()} pts usados · teto d${skillCap(draft.level)}.`;
      break;
    }
    case "vital": {
      const pool = VITAL_POOL();
      html = `<b>Vital:</b> ${draft.pvAlloc ?? "—"} PV · ${draft.pdAlloc ?? "—"} PD de um poço de ${pool}.`;
      break;
    }
    default:
      html = 'Regras da comunidade — detalhes em "Regras & Métodos".';
  }
  el.innerHTML = html;
}

/* ---------------- Finalização ---------------- */
function freshDraft() {
  return {
    name: "",
    age: "",
    concept: "",
    symbol: "✶",
    attrs: { fisico: 6, mente: 6, emocao: 6 },
    profile: null,
    occupation: null,
    level: 2,
    skills: {},
    pvAlloc: null,
    pdAlloc: null,
    notes: "",
    inventory: [],
  };
}

function finalizeDraft() {
  if (!draft.profile) {
    toast("Escolha um perfil para o agente.");
    stepIndex = 3;
    renderWizard();
    return;
  }
  if (!draft.occupation) {
    toast("Escolha uma ocupação.");
    stepIndex = 4;
    renderWizard();
    return;
  }
  if (skillUsed() > skillPool()) {
    toast("Pontos de perícia excedidos.");
    stepIndex = 5;
    renderWizard();
    return;
  }
  const pvMax = draft.attrs.fisico + (draft.pvAlloc ?? 0);
  const pdMax = draft.attrs.emocao + (draft.pdAlloc ?? 0);
  const a = {
    id: "a" + Date.now() + Math.floor(Math.random() * 1000),
    name: draft.name || "Agente sem nome",
    age: draft.age,
    concept: draft.concept,
    symbol: draft.symbol,
    attrs: { ...draft.attrs },
    profile: draft.profile,
    occupation: draft.occupation,
    level: draft.level,
    skills: { ...draft.skills },
    pv_max: pvMax,
    pv_current: pvMax,
    pd_max: pdMax,
    pd_current: pdMax,
    impeto: 0,
    pronto: false,
    notes: "",
    inventory: [],
  };
  saveAgent(a);
  draft = freshDraft();
  stepIndex = 0;
  selectedSkill = null;
  pendingBonusDice = [];
  openSheet(a.id);
}

/* ---------------- FICHA ---------------- */
function openSheet(id) {
  const a = agents.find((x) => x.id === id);
  if (!a) {
    showScreen("home");
    return;
  }
  renderSheet(a);
}

function renderSheet(a) {
  currentAgent = a;
  document.getElementById("sheetName").textContent =
    a.name || "Agente sem nome";
  const p = PROFILES[a.profile] || {};
  document.getElementById("sheetTags").innerHTML =
    `<span class="tag">${esc(a.profile || "")}</span>` +
    `<span class="tag">${esc(a.occupation || "")}</span>` +
    `<span class="tag">Nível ${a.level}</span>` +
    `<span class="tag tag-sym theme-${p.theme || "green"}">${esc(a.symbol || "✶")}</span>`;
  document.getElementById("sheetName").className =
    "sheet-title theme-" + (p.theme || "green");
  const av = document.getElementById("sheetAvatar");
  av.className =
    "avatar avatar-sheet theme-" + (p.theme || "green") + (a.photo ? " photo" : "");
  av.style.backgroundImage = a.photo ? "url('" + a.photo + "')" : "";
  av.textContent = a.photo ? "" : a.symbol || "✶";
  const sheetEl = document.getElementById("screen-sheet");
  sheetEl.className =
    "screen active sheet-theme-" + (p.theme || "green");
  const stripEl = document.getElementById("sheetStrip");
  stripEl.className = "sheet-strip";
  renderAttrSheet(a);
  renderVitals(a);
  renderAbilities(a);
  renderInventory(a);
  document.getElementById("sheetNotes").value = a.notes || "";
  renderSkillSheet();
  renderProfileWidgets(a);
  renderCritZone(a);
  document.getElementById("rollResult").style.display = "none";
  renderRollerHead(selectedSkill || "");
  showScreen("sheet");
}

function renderAttrSheet(a) {
  const el = document.getElementById("sheetAttrs");
  el.innerHTML = "";
  ["fisico", "mente", "emocao"].forEach((k) => {
    const row = document.createElement("div");
    row.className = "attr-row";
    row.innerHTML = `
      <span class="attr-name">${ATTR_LABEL[k]}</span>
      <button class="attr-adjust" type="button" data-d="-1" title="Reduzir ${ATTR_LABEL[k]}">−</button>
      <span class="attr-die">d${a.attrs[k]}</span>
      <button class="attr-adjust" type="button" data-d="1" title="Aumentar ${ATTR_LABEL[k]}">+</button>
      <span class="hint act" role="button" style="margin-left:auto">testar</span>`;
    row.querySelectorAll(".attr-adjust").forEach((b) =>
      b.addEventListener("click", () => adjustAttr(k, Number(b.dataset.d))),
    );
    row.querySelector(".hint").addEventListener("click", () => {
      const dice = [
        { sides: a.attrs[k], label: ATTR_LABEL[k], type: "attr" },
      ].concat(pendingBonusDice.map((b) => ({ ...b })));
      const dt = Number(document.getElementById("dtInput").value) || 7;
      const r = performTest(dice, dt);
      const label = "Teste de " + ATTR_LABEL[k];
      if (r.criticalFail) applyCritFail(a, r);
      renderRollResult(r, label);
      showRollPopup(r, label);
      scrollToRoller();
      autoImp(a, r.passed === false);
    });
    el.appendChild(row);
  });
}

function adjustAttr(k, delta) {
  const a = currentAgent;
  if (!a) return;
  const cur = a.attrs[k];
  const next = stepDie(cur, delta);
  if (next === cur) {
    toast(
      delta > 0
        ? `${ATTR_LABEL[k]} já está no máximo (d12).`
        : `${ATTR_LABEL[k]} já está no mínimo (d4).`,
    );
    return;
  }
  const oldF = a.attrs.fisico;
  const oldE = a.attrs.emocao;
  a.attrs[k] = next;
  a.pv_max = a.pv_max + (a.attrs.fisico - oldF);
  a.pd_max = a.pd_max + (a.attrs.emocao - oldE);
  a.pv_current = Math.min(a.pv_current, a.pv_max);
  a.pd_current = Math.min(a.pd_current, a.pd_max);
  saveAgent(a);
  renderSheet(a);
  toast(`${ATTR_LABEL[k]} agora é d${next}.`);
}

function applyCritFail(a, r) {
  const entry = CRIT_FAIL_TABLE.find((e) => e.roll === r.critRoll);
  if (!entry) return;
  let applied = false;
  if (entry.attr) {
    if (a.attrs[entry.attr] > 4) {
      if (!a.critAttrs) a.critAttrs = {};
      if (!(entry.attr in a.critAttrs)) {
        a.critAttrs[entry.attr] = a.attrs[entry.attr];
        a.attrs[entry.attr] = stepDie(a.attrs[entry.attr], -1);
        applied = true;
      }
    }
  } else if (entry.pv) {
    a.pv_current = Math.max(0, (a.pv_current || 0) - rollDie(4));
    applied = true;
  } else if (entry.pd) {
    a.pd_current = Math.max(0, (a.pd_current || 0) - rollDie(4));
    applied = true;
  } else if (entry.item) {
    if (a.inventory && a.inventory.length) {
      a.inventory.splice(Math.floor(Math.random() * a.inventory.length), 1);
      applied = true;
    }
  }
  if (!applied) return;
  r.critApplied = true;
  saveAgent(a);
  renderSheet(a);
}

function revertCritAttrs(a) {
  const attrs = a.critAttrs || {};
  Object.keys(attrs).forEach((k) => {
    a.attrs[k] = attrs[k];
  });
  a.critAttrs = {};
  saveAgent(a);
  renderSheet(a);
  toast("Atributos restaurados (fim da cena).");
}

function renderCritZone(a) {
  const el = document.getElementById("sheetCritZone");
  if (!el) return;
  el.innerHTML = "";
  const attrs = a.critAttrs || {};
  const keys = Object.keys(attrs);
  if (!keys.length) return;
  const items = keys
    .map((k) => `${ATTR_LABEL[k]} d${a.attrs[k]} (base d${attrs[k]})`)
    .join(" · ");
  const box = document.createElement("div");
  box.className = "crit-penalty card";
  box.innerHTML = `
    <h3 class="card-title">Penalidade de cena</h3>
    <p class="crit-p-info">${esc(items)} — reduzidos por falhas críticas até o fim da cena.</p>
    <button class="btn primary small" id="btnRevertCrit" type="button">Fim da cena · restaurar atributos</button>`;
  box
    .querySelector("#btnRevertCrit")
    .addEventListener("click", () => revertCritAttrs(a));
  el.appendChild(box);
}

function autoImp(agent, failed) {
  if (failed && agent.profile === "Executor") {
    agent.impeto = Math.min(3, (agent.impeto || 0) + 1);
    saveAgent(agent);
    renderProfileWidgets(agent);
  }
}

function renderResourceRow(agent, key) {
  const max = agent[key + "_max"];
  const cur = agent[key + "_current"];
  const pct = max ? Math.max(0, Math.min(1, cur / max)) : 0;
  const label = key === "pv" ? "PV" : "PD";
  return `
    <div class="res-row">
      <span class="res-label">${label}</span>
      <button class="res-btn" data-key="${key}" data-d="-1">−</button>
      <span class="res-num">${cur}/${max}</span>
      <button class="res-btn" data-key="${key}" data-d="1">+</button>
    </div>
    <div class="res-track"><div class="res-fill" style="width:${Math.round(pct * 100)}%"></div></div>`;
}

function renderVitals(a) {
  const el = document.getElementById("sheetVitals");
  el.innerHTML = renderResourceRow(a, "pv") + renderResourceRow(a, "pd");
  el.querySelectorAll(".res-btn").forEach((b) =>
    b.addEventListener("click", () => {
      const key = b.dataset.key;
      const d = Number(b.dataset.d);
      const max = a[key + "_max"];
      a[key + "_current"] = Math.max(
        0,
        Math.min(max, (a[key + "_current"] || 0) + d),
      );
      saveAgent(a);
      renderVitals(a);
    }),
  );
}

function renderAbilities(a) {
  const el = document.getElementById("sheetAbilities");
  el.innerHTML = "";
  const p = PROFILES[a.profile];
  if (p) {
    const card = document.createElement("div");
    card.className = "ability-card";
    card.innerHTML = `<h4>${esc(p.ability.title)} <small>· ${esc(a.profile)}</small></h4><p>${esc(p.ability.text)}</p>`;
    el.appendChild(card);
  }
  const occ = OCCUPATIONS.find((o) => o.name === a.occupation);
  if (occ) {
    const card = document.createElement("div");
    card.className = "ability-card";
    card.innerHTML = `<h4>${esc(occ.ability.name)} <small>· ${esc(a.occupation)}</small></h4>
      <p>${esc(occ.ability.text)}</p>`;
    el.appendChild(card);
  }
  if (!p && !occ)
    el.innerHTML = '<p class="hint">Sem habilidades definidas.</p>';
}

function renderInventory(a) {
  const el = document.getElementById("sheetInventory");
  const items = a.inventory || [];
  el.innerHTML = `
    <div class="inv-add">
      <input type="text" id="invInput" class="input" placeholder="ex.: Lanterna, Diário de D. Maria..." maxlength="60">
      <button id="btnInvAdd" class="btn small" type="button">+</button>
    </div>
    ${
      items
        .map(
          (it, i) => `
      <div class="inv-row"><span>${esc(it)}</span><button class="inv-del" data-i="${i}" type="button" title="Remover">✕</button></div>`,
        )
        .join("") || '<p class="hint">Inventário vazio.</p>'
    }`;
  const inp = el.querySelector("#invInput");
  const add = () => {
    const v = inp.value.trim();
    if (!v) {
      toast("Digite um item.");
      return;
    }
    a.inventory = a.inventory || [];
    a.inventory.push(v);
    inp.value = "";
    saveAgent(a);
    renderInventory(a);
  };
  el.querySelector("#btnInvAdd").addEventListener("click", add);
  inp.addEventListener("keydown", (e) => {
    if (e.key === "Enter") add();
  });
  el.querySelectorAll(".inv-del").forEach((b) =>
    b.addEventListener("click", () => {
      a.inventory.splice(Number(b.dataset.i), 1);
      saveAgent(a);
      renderInventory(a);
    }),
  );
}

/* ---------------- Perícias (ficha) ---------------- */
function renderSkillSheet() {
  if (!currentAgent) return;
  const f = document.getElementById("skillFilter").value;
  const q = (document.getElementById("skillSearch").value || "")
    .toLowerCase()
    .trim();
  const el = document.getElementById("skillList");
  el.innerHTML = "";
  SKILL_DEFS.forEach((s) => {
    if (f !== "all" && s.attr !== f) return;
    if (q && !s.name.toLowerCase().includes(q)) return;
    const row = document.createElement("button");
    row.type = "button";
    row.className = "skill-item" + (selectedSkill === s.name ? " sel" : "");
    row.innerHTML = `<span class="s-die">d${currentAgent.skills[s.name] || 4}</span><span class="s-name">${s.name}</span><span class="s-attr">${ATTR_LABEL[s.attr]}</span>`;
    row.addEventListener("click", () => {
      selectedSkill = s.name;
      renderSkillSheet();
      renderRollerHead(s.name);
      scrollToRoller();
    });
    el.appendChild(row);
  });
  if (!el.children.length)
    el.innerHTML = '<p class="hint">Nenhuma perícia encontrada.</p>';
}

function renderRollerHead(name) {
  document.getElementById("rollerSkillName").textContent =
    name || "selecione uma perícia";
  updateDicePreview();
}

/* ---------------- Rolador de dados ---------------- */
function getDiceForRoll() {
  const dice = [];
  if (selectedSkill && currentAgent) {
    const def = SKILL_DEFS.find((s) => s.name === selectedSkill);
    dice.push({
      sides: currentAgent.skills[selectedSkill] || 4,
      label: selectedSkill,
      type: "skill",
    });
    if (def)
      dice.push({
        sides: currentAgent.attrs[def.attr],
        label: ATTR_LABEL[def.attr],
        type: "attr",
      });
  }
  pendingBonusDice.forEach((b) => dice.push({ ...b }));
  return dice;
}

function updateDicePreview() {
  const dice = getDiceForRoll();
  const el = document.getElementById("dicePreview");
  el.innerHTML = dice.length
    ? dice
        .map(
          (d) =>
            `<span class="die-chip ${d.type === "bonus" ? "bonus" : ""}">${esc(d.label)} · d${d.sides}</span>`,
        )
        .join("")
    : '<span class="hint">Escolha uma perícia na lista ao lado.</span>';
  document.getElementById("btnRoll").disabled = !dice.length;
}

function addBonusDie(type, label) {
  if (pendingBonusDice.length >= 2) {
    toast("Máximo de 2 dados bônus por teste.");
    return false;
  }
  pendingBonusDice.push({
    sides: 4,
    label: label || "Bônus",
    type: type || "bonus",
  });
  renderBonusTags();
  updateDicePreview();
  return true;
}
function removeBonusDie(i) {
  pendingBonusDice.splice(i, 1);
  renderBonusTags();
  updateDicePreview();
}
function renderBonusTags() {
  const el = document.getElementById("bonusDiceTags");
  el.innerHTML = "";
  pendingBonusDice.forEach((b, i) => {
    const t = document.createElement("span");
    t.className = "bonus-tag";
    t.innerHTML = `+1d4 ${esc(b.label)} <button class="bt-x" data-i="${i}" type="button">✕</button>`;
    el.appendChild(t);
  });
  el.querySelectorAll(".bt-x").forEach((x) =>
    x.addEventListener("click", () => removeBonusDie(Number(x.dataset.i))),
  );
}

function buildRollHTML(r, label) {
  let verdict, vClass;
  if (r.passed === true) {
    verdict = r.criticalSuccess ? "SUCESSO CRÍTICO" : "SUCESSO";
    vClass = "gold";
  } else if (r.passed === false) {
    verdict = r.criticalFail ? "FALHA CRÍTICA" : "FALHA";
    vClass = "red";
  } else {
    verdict = r.criticalSuccess
      ? "CRÍTICO!"
      : r.criticalFail
        ? "FALHA CRÍTICA"
        : "—";
    vClass = r.criticalSuccess ? "gold" : r.criticalFail ? "red" : "ink";
  }
  const chips = r.rolled
    .map(
      (d) =>
        `<span class="die-chip ${d.type === "bonus" ? "bonus" : ""}">d${d.sides} → <b>${d.value}</b></span>`,
    )
    .join(" ");
  let critFail = "";
  if (r.criticalFail && r.critRoll) {
    const entry = CRIT_FAIL_TABLE.find((e) => e.roll === r.critRoll);
    if (entry)
      critFail = `<div class="crit-fail">Falha crítica (1d8 = ${r.critRoll}): <b>${entry.name}</b> — ${esc(entry.text)}${r.critApplied ? " <small>(penalidade aplicada à ficha)</small>" : ""}</div>`;
  }
  return `
    <div class="roll-verdict ${vClass}">${esc(label || "")} ${verdict} <small>${r.total} vs DT ${r.dt}</small></div>
    <div class="roll-dice">${chips}</div>
    <div class="roll-meta">Total <b>${r.total}</b> · RA <b>${r.ra}</b> · RB <b>${r.rb}</b>${r.dropped.length ? ` · descartado <b>${r.dropped[0].value}</b>` : ""}</div>
    ${critFail}`;
}

function renderRollResult(r, label) {
  const el = document.getElementById("rollResult");
  el.style.display = "";
  el.innerHTML = buildRollHTML(r, label);
}

function showRollPopup(r, label) {
  document.getElementById("rollPopBody").innerHTML = buildRollHTML(r, label);
  document.getElementById("rollPop").classList.add("show");
}
function hideRollPopup() {
  document.getElementById("rollPop").classList.remove("show");
}

function scrollToRoller() {
  const el = document.querySelector(".roller-card");
  if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
}

function doRoll() {
  if (!currentAgent) return;
  const dice = getDiceForRoll();
  if (!dice.length) return;
  const dt = Number(document.getElementById("dtInput").value) || 7;
  const r = performTest(dice, dt);
  const label = "Teste de " + (selectedSkill || "perícia") + ".";
  if (r.criticalFail) applyCritFail(currentAgent, r);
  renderRollResult(r, label);
  showRollPopup(r, label);
  if (r.passed === false && currentAgent.profile === "Executor")
    autoImp(currentAgent, true);
}

function rollInitiative(a) {
  const dice = [
    { sides: a.attrs.fisico, label: "Físico", type: "attr" },
    { sides: a.attrs.emocao, label: "Emoção", type: "attr" },
  ];
  const r = performTest(dice, null);
  if (r.criticalFail) applyCritFail(a, r);
  renderRollResult(r, "Iniciativa (Fís + Emo).");
  showRollPopup(r, "Iniciativa (Fís + Emo).");
}

/* ---------------- ROLAGEM LIVRE ---------------- */
function parseFreeRoll(src) {
  src = String(src || "").replace(/\s+/g, "");
  if (!src) throw new Error("Expressão vazia.");
  let pos = 0;
  const rolled = [];
  const peek = () => src[pos];
  function parseExpr() {
    let v = parseTerm();
    while (peek() === "+" || peek() === "-") {
      const op = src[pos++];
      const r = parseTerm();
      v = op === "+" ? v + r : v - r;
    }
    return v;
  }
  function parseTerm() {
    let v = parseFactor();
    while (peek() === "*" || peek() === "/") {
      const op = src[pos++];
      const r = parseFactor();
      if (op === "/" && r === 0) throw new Error("Divisão por zero.");
      v = op === "*" ? v * r : v / r;
    }
    return v;
  }
  function parseFactor() {
    let sign = 1;
    if (peek() === "-" || peek() === "+") {
      if (peek() === "-") sign = -1;
      pos++;
    }
    if (peek() === "(") {
      pos++;
      const v = parseExpr();
      if (peek() !== ")") throw new Error("Parêntese não fechado.");
      pos++;
      return sign * v;
    }
    return sign * parseAtomic();
  }
  function parseAtomic() {
    let num = "";
    while (peek() && /[0-9]/.test(peek())) num += src[pos++];
    if (peek() === "d" || peek() === "D") {
      pos++;
      let sides = "";
      while (peek() && /[0-9]/.test(peek())) sides += src[pos++];
      if (!sides) throw new Error("Dado sem número de lados (ex.: d6, 2d20).");
      const count = num ? parseInt(num, 10) : 1;
      const s = parseInt(sides, 10);
      if (count < 1 || count > 50)
        throw new Error("Quantidade de dados inválida (1 a 50).");
      if (s < 1 || s > 1000) throw new Error("Dado inválido (lados de 1 a 1000).");
      let sum = 0;
      for (let i = 0; i < count; i++) {
        const value = 1 + Math.floor(Math.random() * s);
        rolled.push({ sides: s, value, type: "free" });
        sum += value;
      }
      return sum;
    }
    if (!num) throw new Error("Número ou dado esperado.");
    return parseInt(num, 10);
  }
  const total = parseExpr();
  if (pos !== src.length)
    throw new Error("Símbolo inesperado na posição " + (pos + 1) + ".");
  return { total, rolled };
}

function doFreeRoll() {
  const inputEl = document.getElementById("freeRollInput");
  const src = inputEl.value;
  let res;
  try {
    res = parseFreeRoll(src);
  } catch (err) {
    toast("Rolagem inválida: " + err.message);
    inputEl.focus();
    return;
  }
  if (!res.rolled.length) {
    toast("Inclua ao menos um dado, ex.: 2d6+9 ou 1d20+15.");
    inputEl.focus();
    return;
  }
  const values = res.rolled.map((d) => d.value);
  const ra = Math.max(...values);
  const rb = Math.min(...values);
  const vc = {};
  values.forEach((v) => (vc[v] = (vc[v] || 0) + 1));
  const cs = Object.entries(vc).some(([v, c]) => Number(v) >= 6 && c >= 2);
  const cf = values.length >= 2 && values.every((v) => v === 1);
  const r = {
    rolled: res.rolled,
    counted: res.rolled,
    dropped: [],
    total: res.total,
    ra,
    rb,
    criticalSuccess: cs,
    criticalFail: cf,
    critRoll: null,
    critApplied: false,
    passed: null,
    dt: null,
  };
  const label = "Rolagem livre · " + src.trim();
  renderRollResult(r, label);
  showRollPopup(r, label);
}

/* ---------------- FOTO DO AGENTE ---------------- */
let photoState = {
  img: null,
  F: 320,
  base: 1,
  zoom: 1,
  ox: 0,
  oy: 0,
  drag: null,
};

function openPhotoPicker() {
  const f = document.getElementById("photoFile");
  f.value = "";
  f.click();
}

function initPhotoEditor(img) {
  document.getElementById("photoModal").classList.add("show");
  const frame = document.getElementById("photoFrame");
  photoState.img = img;
  photoState.F = frame.clientWidth || 320;
  photoState.base = Math.max(
    photoState.F / img.naturalWidth,
    photoState.F / img.naturalHeight,
  );
  photoState.zoom = 1;
  photoState.scale = photoState.base;
  photoState.ox = (photoState.F - img.naturalWidth * photoState.scale) / 2;
  photoState.oy = (photoState.F - img.naturalHeight * photoState.scale) / 2;
  renderPhoto();
  document.getElementById("photoZoom").value = 100;
}

function renderPhoto() {
  const img = photoState.img;
  if (!img) return;
  const el = document.getElementById("photoFrameImg");
  el.src = img.src;
  el.style.width = img.naturalWidth * photoState.scale + "px";
  el.style.height = img.naturalHeight * photoState.scale + "px";
  el.style.left = photoState.ox + "px";
  el.style.top = photoState.oy + "px";
}

function clampPhoto() {
  const img = photoState.img;
  if (!img) return;
  const sw = img.naturalWidth * photoState.scale;
  const sh = img.naturalHeight * photoState.scale;
  const F = photoState.F;
  if (sw <= F) photoState.ox = (F - sw) / 2;
  else photoState.ox = Math.min(0, Math.max(F - sw, photoState.ox));
  if (sh <= F) photoState.oy = (F - sh) / 2;
  else photoState.oy = Math.min(0, Math.max(F - sh, photoState.oy));
}

function setPhotoZoom(z) {
  const img = photoState.img;
  if (!img) return;
  z = Math.min(5, Math.max(1, z));
  const cx = photoState.ox + (img.naturalWidth * photoState.scale) / 2;
  const cy = photoState.oy + (img.naturalHeight * photoState.scale) / 2;
  photoState.zoom = z;
  photoState.scale = photoState.base * z;
  photoState.ox = cx - (img.naturalWidth * photoState.scale) / 2;
  photoState.oy = cy - (img.naturalHeight * photoState.scale) / 2;
  clampPhoto();
  renderPhoto();
}

function savePhoto() {
  const img = photoState.img;
  if (!img || !currentAgent) return;
  const cx = -photoState.ox / photoState.scale;
  const cy = -photoState.oy / photoState.scale;
  const cw = photoState.F / photoState.scale;
  const out = document.createElement("canvas");
  out.width = 400;
  out.height = 400;
  out.getContext("2d").drawImage(img, cx, cy, cw, cw, 0, 0, 400, 400);
  currentAgent.photo = out.toDataURL("image/jpeg", 0.85);
  saveAgent(currentAgent);
  renderSheet(currentAgent);
  renderHome();
  closePhotoEditor();
  toast("Foto atualizada.");
}

function clearPhoto() {
  if (!currentAgent) return;
  currentAgent.photo = null;
  saveAgent(currentAgent);
  renderSheet(currentAgent);
  renderHome();
  closePhotoEditor();
  toast("Foto removida.");
}

function closePhotoEditor() {
  document.getElementById("photoModal").classList.remove("show");
  photoState.img = null;
  photoState.drag = null;
}

/* ---------------- Widgets de perfil / ocupação ---------------- */
function makeWidget(inner) {
  const c = document.createElement("div");
  c.className = "ability-card profile-widget";
  c.innerHTML = inner;
  return c;
}

function afterAgentChange(agent) {
  saveAgent(agent);
  renderSheet(agent);
}

function renderProfileWidgets(a) {
  const parent = document.getElementById("sheetProfileWidgets");
  if (!parent) return;
  parent.querySelectorAll(".profile-widget").forEach((el) => el.remove());
  if (a.profile === "Executor") parent.appendChild(widgetImpeto(a));
  if (a.profile === "Analista") parent.appendChild(widgetAvaliacao(a));
  if (a.profile === "Vigilante") parent.appendChild(widgetProntidao(a));
  if (a.occupation) parent.appendChild(widgetOcupacao(a));
}

function widgetImpeto(a) {
  const spaces = [1, 2, 3]
    .map(
      (i) =>
        `<span class="imp-cell${i <= (a.impeto || 0) ? " filled" : ""}" data-i="${i}"></span>`,
    )
    .join("");
  const impDie = pendingBonusDice.some((b) => b.type === "imp");
  const boost = a.impBoost;
  const boostHtml = boost
    ? `<div class="imp-boost"><span class="tb-hint">Passo temporário ativo: <b>${ATTR_LABEL[boost.attr]}</b> d${a.attrs[boost.attr]} (base d${boost.base})</span><button class="btn small ghost" id="impRevert" type="button">Reverter (fim da cena)</button></div>`
    : "";
  const w = makeWidget(`
    <h4>Ímpeto <small>· Executor</small></h4>
    <p class="ab-desc">Falhas em testes preenchem um espaço automaticamente.</p>
    <div class="imp-bar">${spaces}</div>
    ${boostHtml}
    <div class="ab-actions">
      <button class="btn small" id="impUse1" type="button" ${a.impeto >= 1 ? "" : "disabled"}>Gastar 1 · +1d4</button>
      <button class="btn small" id="impUse3" type="button" ${a.impeto >= 3 ? "" : "disabled"}>Gastar 3 · passo de atributo</button>
      ${impDie ? '<button class="btn small ghost" id="impDropDie" type="button">Retirar dado bônus do Ímpeto</button>' : ""}
    </div>`);
  w.querySelectorAll(".imp-cell").forEach((c) =>
    c.addEventListener("click", () => {
      const i = Number(c.dataset.i);
      a.impeto = a.impeto === i ? 0 : i;
      afterAgentChange(a);
    }),
  );
  w.querySelector("#impUse1").addEventListener("click", () => {
    if (!(a.impeto >= 1)) return;
    a.impeto -= 1;
    const ok = addBonusDie("imp", "Ímpeto");
    if (ok) afterAgentChange(a);
    else a.impeto += 1;
  });
  w.querySelector("#impUse3").addEventListener("click", () => {
    if (!(a.impeto >= 3)) return;
    if (a.impBoost) {
      toast("Já há um passo de Ímpeto ativo nesta cena.");
      return;
    }
    attrChoiceModal(
      "Passo de atributo",
      "Escolha o atributo a aumentar em um passo até o fim da cena:",
      [
        { label: "Físico", value: "fisico" },
        { label: "Mente", value: "mente" },
        { label: "Emoção", value: "emocao" },
      ],
      (sel) => {
        a.impeto -= 3;
        a.impBoost = { attr: sel, base: a.attrs[sel] };
        a.attrs[sel] = stepDie(a.attrs[sel], 1);
        afterAgentChange(a);
        toast(ATTR_LABEL[sel] + " +1 passo até o fim da cena.");
      },
    );
  });
  if (impDie) {
    w.querySelector("#impDropDie").addEventListener("click", () => {
      const i = pendingBonusDice.findIndex((b) => b.type === "imp");
      if (i >= 0) {
        removeBonusDie(i);
        renderProfileWidgets(a);
      }
    });
  }
  if (boost) {
    w.querySelector("#impRevert").addEventListener("click", () => {
      a.attrs[boost.attr] = boost.base;
      delete a.impBoost;
      afterAgentChange(a);
      toast("Passo temporário do Ímpeto revertido.");
    });
  }
  return w;
}

function widgetAvaliacao(a) {
  const w = makeWidget(`
    <h4>Avaliação <small>· Analista</small></h4>
    <p class="ab-desc">Gaste uma ação e 2 PD para observar um ser ou ambiente. Até 2 dados bônus (+1d4) para usar contra o alvo.</p>
    <div class="ab-actions"><button class="btn small" id="aObs" type="button">Observar (−2 PD) · +1d4</button></div>`);
  w.querySelector("#aObs").addEventListener("click", () => {
    if (pendingBonusDice.length >= 2) {
      toast("Limite de dados bônus atingido.");
      return;
    }
    if ((a.pd_current || 0) < 2) {
      toast("PD insuficientes.");
      return;
    }
    a.pd_current -= 2;
    const ok = addBonusDie("aval", "Avaliação");
    if (ok) afterAgentChange(a);
    else a.pd_current += 2;
  });
  return w;
}

function widgetOcupacao(a) {
  const occ = OCCUPATIONS.find((o) => o.name === a.occupation);
  if (!occ) return makeWidget("");
  const ab = occ.ability;
  if (ab.kind === "focus") return widgetFocusAbility(a, occ, ab);
  if (ab.kind === "mentoria") return widgetMentoria(a, occ);
  if (ab.kind === "acaoExtra") return widgetAcaoExtra(a, occ);
  return makeWidget("");
}

function widgetFocusAbility(a, occ, ab) {
  const samples = SKILL_DEFS.filter((s) => s.attr === ab.focus)
    .slice(0, 2)
    .map((s) => s.name)
    .join(", ");
  const w = makeWidget(`
    <h4>${esc(ab.name)} <small>· ${esc(occ.name)}</small></h4>
    <p class="ab-desc">Gaste 2 PD para receber +1d4 em um teste ${ATTR_ADJ[ab.focus]} (ex.: ${samples}).</p>
    <div class="ab-actions"><button class="btn small" id="occFocus" type="button">Ativar ${esc(ab.name)} (−2 PD)</button></div>`);
  w.querySelector("#occFocus").addEventListener("click", () => {
    const skillDef =
      selectedSkill && SKILL_DEFS.find((s) => s.name === selectedSkill);
    if (!skillDef || skillDef.attr !== ab.focus) {
      toast(
        `Use ${ab.name} em um teste ${ATTR_ADJ[ab.focus]} — selecione uma perícia ${ATTR_ADJ[ab.focus]} (ex.: ${samples}).`,
      );
      return;
    }
    if (pendingBonusDice.length >= 2) {
      toast("Limite de dados bônus atingido.");
      return;
    }
    if ((a.pd_current || 0) < 2) {
      toast("PD insuficientes.");
      return;
    }
    a.pd_current -= 2;
    const ok = addBonusDie("occ", ab.name);
    if (ok) afterAgentChange(a);
    else a.pd_current += 2;
  });
  return w;
}

function widgetMentoria(a, occ) {
  const w = makeWidget(`
    <h4>${esc(occ.ability.name)} <small>· ${esc(occ.name)}</small></h4>
    <p class="ab-desc">Ao ajudar outro personagem, teste a perícia usada contra DT 7. Se passar (sucesso ou crítico), o ajudado pode substituir um dos dados rolados pela sua rolagem alta.</p>
    <div class="ab-actions"><button class="btn small" id="occMentoria" type="button">Ajudar aliado (DT 7)</button></div>`);
  w.querySelector("#occMentoria").addEventListener("click", () => {
    if (!selectedSkill || !currentAgent) {
      toast("Selecione a perícia usada para ajudar (na lista à direita).");
      return;
    }
    const r = performTest(getDiceForRoll(), 7);
    if (r.criticalFail) applyCritFail(currentAgent, r);
    renderRollResult(r, `Mentoria · ${selectedSkill} (ajuda)`);
    showRollPopup(r, `Mentoria · ${selectedSkill} (ajuda)`);
    if (r.passed)
      toast("Sucesso! O aliado pode substituir um dado pela sua rolagem alta.");
    else toast("Falha na Mentoria — nenhum dado substituído.");
  });
  return w;
}

function widgetAcaoExtra(a, occ) {
  const usado = !!a.incansavelUsado;
  const w = makeWidget(`
    <h4>${esc(occ.ability.name)} <small>· ${esc(occ.name)}</small></h4>
    <p class="ab-desc">Uma vez por cena de conflito, gaste 5 PV para fazer uma ação extra.</p>
    <div class="ab-actions">
      <button class="btn small" id="occAcao" type="button" ${(a.pv_current || 0) >= 5 && !usado ? "" : "disabled"}>Ação extra (−5 PV)</button>
      <button class="btn small ghost" id="occReset" type="button" ${usado ? "" : "disabled"}>Fim da cena</button>
    </div>`);
  w.querySelector("#occAcao").addEventListener("click", () => {
    if (usado) return;
    if ((a.pv_current || 0) < 5) {
      toast("PV insuficientes.");
      return;
    }
    a.pv_current -= 5;
    a.incansavelUsado = true;
    afterAgentChange(a);
    toast("Ação extra! Você age fora do seu turno.");
  });
  w.querySelector("#occReset").addEventListener("click", () => {
    a.incansavelUsado = false;
    afterAgentChange(a);
    toast("Nova cena: Incansável disponível novamente.");
  });
  return w;
}

function widgetProntidao(a) {
  const w = makeWidget(`
    <h4>Prontidão <small>· Vigilante</small></h4>
    <p class="ab-desc">No início de um conflito, gaste 3 PD para ganhar uma rodada agindo antes de todos.</p>
    <div class="ab-actions"><button class="btn small" id="pPronto" type="button">Gastar 3 PD</button></div>`);
  w.querySelector("#pPronto").addEventListener("click", () => {
    if ((a.pd_current || 0) < 3) {
      toast("PD insuficientes.");
      return;
    }
    confirmModal(
      "Prontidão",
      "Gastar 3 PD para agir primeiro no próximo conflito?",
      () => {
        a.pd_current -= 3;
        a.pronto = true;
        afterAgentChange(a);
        toast("Prontidão ativa!");
      },
    );
  });
  return w;
}

/* ---------------- Exportar ---------------- */
function exportAgent(a) {
  const blob = new Blob([JSON.stringify(a, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const x = document.createElement("a");
  x.href = url;
  x.download =
    (a.name || "agente").replace(/[^a-zA-Z0-9 _-]/g, "") + ".op2.json";
  document.body.appendChild(x);
  x.click();
  document.body.removeChild(x);
  URL.revokeObjectURL(url);
}

/* ---------------- Modais / toast ---------------- */
function showModal(title, text) {
  document.getElementById("modalTitle").textContent = title;
  document.getElementById("modalText").textContent = text;
  document.getElementById("modal").classList.add("show");
}
function hideModal() {
  document.getElementById("modal").classList.remove("show");
}

function confirmModal(title, text, onOk) {
  showModal(title, text);
  const actions = document.getElementById("modalActions");
  actions.innerHTML = "";
  const yes = document.createElement("button");
  yes.className = "btn primary";
  yes.textContent = "Sim";
  yes.addEventListener("click", () => {
    hideModal();
    if (onOk) onOk();
  });
  const no = document.createElement("button");
  no.className = "btn ghost";
  no.textContent = "Cancelar";
  no.addEventListener("click", hideModal);
  actions.appendChild(yes);
  actions.appendChild(no);
}

function attrChoiceModal(title, text, options, cb) {
  showModal(title, text);
  const actions = document.getElementById("modalActions");
  actions.innerHTML = "";
  options.forEach((o) => {
    const b = document.createElement("button");
    b.className = "btn";
    b.textContent = o.label;
    b.addEventListener("click", () => {
      hideModal();
      if (cb) cb(o.value);
    });
    actions.appendChild(b);
  });
  const cancel = document.createElement("button");
  cancel.className = "btn ghost";
  cancel.textContent = "Cancelar";
  cancel.addEventListener("click", hideModal);
  actions.appendChild(cancel);
}

let toastTimer = null;
function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
}

/* ---------------- Inicialização ---------------- */
function bindGlobal() {
  document.querySelectorAll("[data-nav]").forEach((b) =>
    b.addEventListener("click", () => {
      const target = b.dataset.nav;
      if (target === "create") {
        stepIndex = 0;
        draft = freshDraft();
      }
      showScreen(target);
    }),
  );

  document.getElementById("btnPrev").addEventListener("click", () => {
    if (stepIndex > 0) {
      stepIndex--;
      renderWizard();
    }
  });
  document.getElementById("btnNext").addEventListener("click", () => {
    if (stepIndex < STEPS.length - 1) {
      stepIndex++;
      renderWizard();
    } else finalizeDraft();
  });

  document.getElementById("dtInput").addEventListener("input", () => {
    document.getElementById("rollResult").style.display = "none";
  });

  document.getElementById("btnRoll").addEventListener("click", doRoll);
  document.getElementById("btnFreeRoll").addEventListener("click", doFreeRoll);
  document.getElementById("freeRollInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      doFreeRoll();
    }
  });
  document
    .getElementById("btnRollInit")
    .addEventListener(
      "click",
      () => currentAgent && rollInitiative(currentAgent),
    );
  document
    .getElementById("btnExport")
    .addEventListener("click", () => currentAgent && exportAgent(currentAgent));
  document.getElementById("btnDelete").addEventListener("click", () => {
    if (!currentAgent) return;
    confirmModal(
      "Excluir agente?",
      `"${currentAgent.name}" será apagado permanentemente.`,
      async () => {
        await apiDelete("/api/agents/" + encodeURIComponent(currentAgent.id));
        agents = agents.filter((x) => x.id !== currentAgent.id);
        currentAgent = null;
        showScreen("home");
      },
    );
  });

  document
    .getElementById("skillFilter")
    .addEventListener("change", renderSkillSheet);
  document
    .getElementById("skillSearch")
    .addEventListener("input", renderSkillSheet);
  document.getElementById("sheetNotes").addEventListener("input", (e) => {
    if (currentAgent) {
      currentAgent.notes = e.target.value;
      saveAgent(currentAgent);
    }
  });
  document.getElementById("modal").addEventListener("click", (e) => {
    if (e.target.id === "modal") hideModal();
  });

  document.getElementById("btnLogout").addEventListener("click", async () => {
    if (getToken()) apiPost("/api/auth/logout").catch(() => {});
    doLogout();
  });
  document.getElementById("btnToggleMode").addEventListener("click", toggleAuthMode);
  document.getElementById("loginForm").addEventListener("submit", (e) => {
    e.preventDefault();
    doLogin();
  });

  document.getElementById("rollPopClose").addEventListener("click", hideRollPopup);
  document.getElementById("rollPop").addEventListener("click", (e) => {
    if (e.target.id === "rollPop") hideRollPopup();
  });

  document.getElementById("sheetAvatar").addEventListener("click", () => {
    if (!currentAgent) return;
    if (currentAgent.photo) {
      const img = new Image();
      img.onload = () => initPhotoEditor(img);
      img.src = currentAgent.photo;
    } else {
      openPhotoPicker();
    }
  });
  document.getElementById("photoFile").addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => initPhotoEditor(img);
      img.onerror = () => toast("Não foi possível carregar a imagem.");
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
  document
    .getElementById("photoZoom")
    .addEventListener("input", (e) => setPhotoZoom(Number(e.target.value) / 100));
  document
    .getElementById("photoZoomIn")
    .addEventListener("click", () => setPhotoZoom(photoState.zoom + 0.25));
  document
    .getElementById("photoZoomOut")
    .addEventListener("click", () => setPhotoZoom(photoState.zoom - 0.25));
  document.getElementById("photoSave").addEventListener("click", savePhoto);
  document.getElementById("photoNew").addEventListener("click", openPhotoPicker);
  document.getElementById("photoClear").addEventListener("click", clearPhoto);
  document.getElementById("photoCancel").addEventListener("click", closePhotoEditor);
  document.getElementById("photoModal").addEventListener("click", (e) => {
    if (e.target.id === "photoModal") closePhotoEditor();
  });
  const frameEl = document.getElementById("photoFrame");
  frameEl.addEventListener("pointerdown", (e) => {
    if (!photoState.img) return;
    photoState.drag = {
      x: e.clientX,
      y: e.clientY,
      ox: photoState.ox,
      oy: photoState.oy,
    };
    frameEl.setPointerCapture(e.pointerId);
  });
  frameEl.addEventListener("pointermove", (e) => {
    if (!photoState.drag) return;
    photoState.ox = photoState.drag.ox + (e.clientX - photoState.drag.x);
    photoState.oy = photoState.drag.oy + (e.clientY - photoState.drag.y);
    clampPhoto();
    renderPhoto();
  });
  const endPhotoDrag = () => {
    photoState.drag = null;
  };
  frameEl.addEventListener("pointerup", endPhotoDrag);
  frameEl.addEventListener("pointercancel", endPhotoDrag);
}

let authMode = "login";
function setAuthError(msg) {
  document.getElementById("loginError").textContent = msg || "";
}
function toggleAuthMode() {
  authMode = authMode === "login" ? "register" : "login";
  const btn = document.getElementById("btnLogin");
  const link = document.getElementById("btnToggleMode");
  if (authMode === "register") {
    btn.textContent = "Criar conta";
    link.textContent = "Já tenho conta";
    document.getElementById("loginPass").autocomplete = "new-password";
  } else {
    btn.textContent = "Entrar";
    link.textContent = "Criar conta";
  }
  setAuthError("");
}
async function doLogin() {
  setAuthError("");
  const username = document.getElementById("loginUser").value.trim();
  const password = document.getElementById("loginPass").value;
  if (!username || !password) {
    setAuthError("Preencha usuário e senha.");
    return;
  }
  const path = authMode === "register" ? "/api/auth/register" : "/api/auth/login";
  try {
    const r = await api(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    localStorage.setItem(AUTH_KEY, r.token);
    await bootApp();
  } catch (e) {
    setAuthError(e.message);
  }
}
function apiPost(path, body) {
  return api(path, { method: "POST", body: JSON.stringify(body || {}) });
}
async function bootApp() {
  setAuthError("");
  try {
    const me = await apiGet("/api/me");
    currentUser = me.user;
    agents = me.agents || [];
    document.getElementById("homeUser").textContent =
      currentUser ? "Conta: " + currentUser.username : "";
    showScreen("home");
  } catch (e) {
    showScreen("login");
  }
}
function doLogout() {
  localStorage.removeItem(AUTH_KEY);
  currentUser = null;
  agents = [];
  currentAgent = null;
  document.getElementById("loginUser").value = "";
  document.getElementById("loginPass").value = "";
  setAuthError("");
  showScreen("login");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
function init() {
  bindGlobal();
  if (getToken()) bootApp();
  else showScreen("login");
}

import "./style.css";

type CustomerType = "normal" | "hot";
const styles = ["fact", "mirror", "precise", "empathy", "meme", "coolcut", "ask", "silent"] as const;
type Style = (typeof styles)[number];
type Cue = "mount" | "self" | "romance" | "otaku" | "know" | "contra" | "hot" | "victim";

type Card = { id: string; name: string; text: string; style: Style; cost: number; power: number; risk: number; cd: number };
type Phase = { topic: string; line: string; cues: Cue[]; prefers: Style[]; heat: number; drain: number };
type Template = {
  name: string; mood: string; type: CustomerType; order: string;
  weak: Style[]; resist: Style[]; heatRate: number; start: [number, number]; target: [number, number]; patience: [number, number]; base: number;
  phases: Phase[];
};
type Active = {
  id: number; t: Template; temp: number; target: number; patience: number; maxPatience: number;
  phase: number; phaseLeft: number; styleUse: Record<Style, number>; variety: Set<Style>; failPressure: number;
};
type Rank = { name: string; score: number; date: string };
type Chain = { style: Style; at: number };
type Recipe = { name: string; seq: Style[]; cool: number; score: number; insight: number };

const TOTAL = 120;
const LOG_MAX = 8;
const RANK_KEY = "coolsakeshop-ranking-v2";
const styleName: Record<Style, string> = {
  fact: "ソース追及", mirror: "鏡返し", precise: "解像度刺し", empathy: "共感落差",
  meme: "ミーム皮肉", coolcut: "温度カット", ask: "逆質問", silent: "無言圧"
};

const cards: Card[] = [
  { id: "source", name: "一次ソースは？", text: "根拠要求", style: "fact", cost: 16, power: 5.2, risk: 2.0, cd: 4.1 },
  { id: "mirror", name: "それ感想ですよね", text: "主語を返す", style: "mirror", cost: 18, power: 5.5, risk: 2.3, cd: 4.6 },
  { id: "rough", name: "解像度が粗い", text: "抽象論を冷却", style: "precise", cost: 14, power: 4.7, risk: 1.8, cd: 3.2 },
  { id: "sorena", name: "それな、でも", text: "受けて落とす", style: "empathy", cost: 12, power: 3.4, risk: 1.0, cd: 2.6 },
  { id: "shiran", name: "知らんけど", text: "熱量ずらし", style: "meme", cost: 10, power: 4.0, risk: 2.6, cd: 2.2 },
  { id: "yousuru", name: "要するに？", text: "要点詰め", style: "ask", cost: 14, power: 4.9, risk: 1.8, cd: 3.0 },
  { id: "ondo", name: "温度だけ高い", text: "勢い遮断", style: "coolcut", cost: 17, power: 5.7, risk: 2.2, cd: 4.2 },
  { id: "mugon", name: "無言の一瞥", text: "大冷却", style: "silent", cost: 20, power: 6.4, risk: 2.9, cd: 6.0 },
  { id: "kusa", name: "その温度で草", text: "ミーム牽制", style: "meme", cost: 11, power: 4.2, risk: 2.4, cd: 2.8 }
];

const recipes: Recipe[] = [
  { name: "共感落差", seq: ["empathy", "mirror"], cool: 3.6, score: 28, insight: 8 },
  { name: "一次ソース詰め", seq: ["fact", "ask"], cool: 4.3, score: 34, insight: 7 },
  { name: "温度差凍結", seq: ["coolcut", "silent"], cool: 5.3, score: 46, insight: 6 },
  { name: "草から解像度", seq: ["meme", "precise"], cool: 3.8, score: 24, insight: 6 }
];

const normalTemplates: Template[] = [
  {
    name: "数字マウント会社員", mood: "功績トーク連投", type: "normal", order: "吟醸ハイボール",
    weak: ["mirror", "fact", "coolcut"], resist: ["empathy", "meme"], heatRate: 0.76,
    start: [8.5, 14.5], target: [-2.1, 0.2], patience: [16.5, 21], base: 185,
    phases: [
      { topic: "武勇伝", line: "この前の案件、俺が全部回してさ。", cues: ["mount"], prefers: ["mirror", "coolcut"], heat: 0.26, drain: 1.04 },
      { topic: "数字自慢", line: "売上3倍って普通は無理でしょ。", cues: ["mount", "know"], prefers: ["fact", "ask"], heat: 0.32, drain: 1.14 },
      { topic: "締め", line: "俺クラスだと空気で分かるから。", cues: ["mount"], prefers: ["precise", "mirror"], heat: 0.40, drain: 1.22 }
    ]
  },
  {
    name: "恋バナ相談民", mood: "共感待ち", type: "normal", order: "柚子サワー",
    weak: ["empathy", "ask", "mirror"], resist: ["fact", "silent"], heatRate: 0.62,
    start: [6.8, 12.5], target: [-1.4, 0.6], patience: [17.5, 22], base: 165,
    phases: [
      { topic: "既読未返信", line: "既読つくのに返信こないの、どう思う？", cues: ["romance", "victim"], prefers: ["empathy", "ask"], heat: 0.12, drain: 0.95 },
      { topic: "不安拡大", line: "もう脈なしってことかな...。", cues: ["romance", "victim"], prefers: ["empathy", "mirror"], heat: 0.20, drain: 1.03 },
      { topic: "強がり", line: "別に期待してないし、知らんけど。", cues: ["romance", "contra"], prefers: ["mirror", "meme"], heat: 0.28, drain: 1.12 }
    ]
  },
  {
    name: "知ったか情報通", mood: "一次ソース未所持", type: "normal", order: "辛口純米",
    weak: ["fact", "precise", "ask"], resist: ["meme", "empathy"], heatRate: 0.74,
    start: [7.8, 14.2], target: [-2.0, -0.1], patience: [16.2, 20.7], base: 198,
    phases: [
      { topic: "断言", line: "それ、もう業界では常識だよ。", cues: ["know"], prefers: ["fact", "precise"], heat: 0.22, drain: 1.08 },
      { topic: "語気強化", line: "見れば分かるって、説明いらないでしょ。", cues: ["know", "mount"], prefers: ["ask", "fact"], heat: 0.32, drain: 1.18 },
      { topic: "逃げ", line: "細かい話は本質じゃないから。", cues: ["contra", "know"], prefers: ["mirror", "precise"], heat: 0.40, drain: 1.26 }
    ]
  },
  {
    name: "逆張り評論家", mood: "とりあえず否定", type: "normal", order: "青みかんサワー",
    weak: ["ask", "mirror", "silent"], resist: ["meme", "empathy"], heatRate: 0.82,
    start: [9.0, 15.0], target: [-2.5, -0.4], patience: [15.7, 20.1], base: 210,
    phases: [
      { topic: "逆張り導入", line: "流行ってる時点で浅いんだよね。", cues: ["contra"], prefers: ["ask", "mirror"], heat: 0.24, drain: 1.12 },
      { topic: "概念マウント", line: "理解できる人だけ分かればいいから。", cues: ["contra", "mount"], prefers: ["silent", "precise"], heat: 0.33, drain: 1.2 },
      { topic: "逃げ道", line: "個人の感想だけど反論は不要。", cues: ["contra", "know"], prefers: ["mirror", "ask"], heat: 0.42, drain: 1.28 }
    ]
  }
];

const hotTemplates: Template[] = [
  {
    name: "熱血セミナー講師", mood: "声量MAX", type: "hot", order: "灼熱レモンサワー",
    weak: ["coolcut", "silent", "fact"], resist: ["meme", "empathy"], heatRate: 1.62,
    start: [12.8, 19.2], target: [-4.5, -1.2], patience: [14.2, 17.4], base: 340,
    phases: [
      { topic: "気合押し", line: "魂が燃えてれば温度計なんて不要！", cues: ["hot"], prefers: ["coolcut", "silent"], heat: 0.72, drain: 1.35 },
      { topic: "根拠無視", line: "データより熱意だ、熱意！", cues: ["hot", "mount"], prefers: ["fact", "ask"], heat: 0.86, drain: 1.46 },
      { topic: "絶叫", line: "今この瞬間に限界を超えろ！！", cues: ["hot"], prefers: ["coolcut", "mirror"], heat: 0.95, drain: 1.58 }
    ]
  },
  {
    name: "配信系熱量モンスター", mood: "連投テンション", type: "hot", order: "爆熱ジンジャー",
    weak: ["fact", "precise", "coolcut"], resist: ["meme", "mirror"], heatRate: 1.67,
    start: [13.2, 20.1], target: [-4.7, -1.5], patience: [13.9, 16.8], base: 368,
    phases: [
      { topic: "長文お気持ち", line: "今の空気、全部言語化しておくね。", cues: ["hot", "victim"], prefers: ["precise", "fact"], heat: 0.74, drain: 1.36 },
      { topic: "自己正当化", line: "本気だからこそ言い方が強くなるんだよ。", cues: ["hot", "know"], prefers: ["ask", "coolcut"], heat: 0.88, drain: 1.5 },
      { topic: "最終通告", line: "理解できない人は置いていくから。", cues: ["hot", "mount"], prefers: ["coolcut", "silent"], heat: 1.0, drain: 1.62 }
    ]
  }
];

const state = {
  running: false, customerId: 1, active: null as Active | null, hand: [] as Card[],
  score: 0, combo: 0, timeLeft: TOTAL, fuel: 72, insight: 45, battle: 0, rhythm: 0, stun: 0, lock: 0,
  tick: 0, lastTick: 0, elapsed: 0, lastMash: 0, lastStyle: null as Style | null, streak: 0,
  chain: [] as Chain[], cd: {} as Record<string, number>, logs: [] as string[], ranking: [] as Rank[],
  resultScore: 0, served: 0
};

const ui = {
  time: must<HTMLElement>("time-value"), score: must<HTMLElement>("score-value"), combo: must<HTMLElement>("combo-value"), fuel: must<HTMLElement>("fuel-value"), insight: must<HTMLElement>("insight-value"),
  startBtn: must<HTMLButtonElement>("start-btn"), typeBadge: must<HTMLElement>("type-badge"), customerName: must<HTMLElement>("customer-name"), customerMood: must<HTMLElement>("customer-mood"), phaseTopic: must<HTMLElement>("phase-topic"), customerLine: must<HTMLElement>("customer-line"), orderName: must<HTMLElement>("order-name"),
  tempValue: must<HTMLElement>("temp-value"), targetValue: must<HTMLElement>("target-value"), tempFill: must<HTMLElement>("temp-fill"), patienceValue: must<HTMLElement>("patience-value"), patienceFill: must<HTMLElement>("patience-fill"), fuelMeterValue: must<HTMLElement>("fuel-meter-value"), fuelFill: must<HTMLElement>("fuel-fill"),
  battleWrap: must<HTMLElement>("battle-wrap"), battleValue: must<HTMLElement>("battle-value"), battleFill: must<HTMLElement>("battle-fill"), rhythmWrap: must<HTMLElement>("rhythm-wrap"), rhythmValue: must<HTMLElement>("rhythm-value"), rhythmFill: must<HTMLElement>("rhythm-fill"),
  statusLine: must<HTMLElement>("status-line"), cardButtons: must<HTMLElement>("card-buttons"), hotActions: must<HTMLElement>("hot-actions"), rhythmGuide: must<HTMLElement>("rhythm-guide"),
  uoBtn: must<HTMLButtonElement>("uo-btn"), serveBtn: must<HTMLButtonElement>("serve-btn"), logList: must<HTMLOListElement>("log-list"), rankingList: must<HTMLOListElement>("ranking-list"),
  resultModal: must<HTMLElement>("result-modal"), finalScore: must<HTMLElement>("final-score"), resultNote: must<HTMLElement>("result-note"), playerName: must<HTMLInputElement>("player-name"), saveBtn: must<HTMLButtonElement>("save-btn"), retryBtn: must<HTMLButtonElement>("retry-btn")
};

function must<T extends HTMLElement>(id: string): T {
  const e = document.getElementById(id);
  if (!e) throw new Error(`Missing element: ${id}`);
  return e as T;
}
function clamp(n: number, min: number, max: number): number { return Math.min(max, Math.max(min, n)); }
function rf(min: number, max: number): number { return Math.random() * (max - min) + min; }
function ri(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick<T>(arr: T[]): T { return arr[ri(0, arr.length - 1)]; }
function fmtClock(sec: number): string { const t = Math.max(0, Math.floor(sec)); return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`; }
function addLog(text: string): void { state.logs.unshift(`[${fmtClock(state.timeLeft)}] ${text}`); state.logs = state.logs.slice(0, LOG_MAX); renderLogs(); }
function phaseOf(c: Active): Phase { return c.t.phases[c.phase]; }
function initStyleUse(): Record<Style, number> { return { fact: 0, mirror: 0, precise: 0, empathy: 0, meme: 0, coolcut: 0, ask: 0, silent: 0 }; }
function initCd(): Record<string, number> { const o: Record<string, number> = {}; cards.forEach((c) => (o[c.id] = 0)); return o; }

function weightedCard(c: Active, excludes: Set<string>): Card {
  const p = phaseOf(c);
  const list = cards.filter((x) => !excludes.has(x.id));
  const pool = list.length > 0 ? list : cards;
  const weighted = pool.map((x) => {
    let w = 1;
    if (c.t.weak.includes(x.style)) w += 2.2;
    if (p.prefers.includes(x.style)) w += 1.7;
    if (c.t.resist.includes(x.style)) w -= 0.35;
    return { x, w: Math.max(0.1, w) };
  });
  const sum = weighted.reduce((a, b) => a + b.w, 0);
  let roll = Math.random() * sum;
  for (const it of weighted) { roll -= it.w; if (roll <= 0) return it.x; }
  return weighted[weighted.length - 1].x;
}

function buildHand(c: Active): void {
  state.hand = [];
  for (let i = 0; i < 4; i += 1) {
    state.hand.push(weightedCard(c, new Set(state.hand.map((x) => x.id))));
  }
}

function replaceCard(i: number): void {
  const c = state.active;
  if (!c) return;
  const ex = new Set<string>();
  state.hand.forEach((x, idx) => { if (idx !== i) ex.add(x.id); });
  state.hand[i] = weightedCard(c, ex);
}

function startGame(): void {
  state.running = true; state.customerId = 1; state.active = null; state.hand = [];
  state.score = 0; state.combo = 0; state.timeLeft = TOTAL; state.fuel = 72; state.insight = 45; state.battle = 0; state.rhythm = 0;
  state.stun = 0; state.lock = 0; state.elapsed = 0; state.lastMash = 0; state.lastStyle = null; state.streak = 0;
  state.chain = []; state.cd = initCd(); state.logs = []; state.resultScore = 0; state.served = 0;
  ui.resultModal.classList.add("hidden"); ui.saveBtn.disabled = false; ui.startBtn.textContent = "営業中..."; ui.startBtn.disabled = true;
  addLog("開店。客の会話パターンを読んで冷却を組み立てる。");
  spawnCustomer(); beginTick(); updateUi();
}

function beginTick(): void {
  clearInterval(state.tick); state.lastTick = performance.now();
  state.tick = window.setInterval(() => {
    const now = performance.now(); const dt = Math.max(0.016, (now - state.lastTick) / 1000); state.lastTick = now; step(dt);
  }, 80);
}
function stopTick(): void { clearInterval(state.tick); }

function spawnCustomer(): void {
  if (!state.running) return;
  const hotChance = state.timeLeft > 30 ? 0.36 : 0.26;
  const t = pick(Math.random() < hotChance ? hotTemplates : normalTemplates);
  const patience = rf(t.patience[0], t.patience[1]);
  state.active = { id: state.customerId, t, temp: rf(t.start[0], t.start[1]), target: rf(t.target[0], t.target[1]), patience, maxPatience: patience, phase: 0, phaseLeft: rf(4.8, 6.4), styleUse: initStyleUse(), variety: new Set<Style>(), failPressure: 0 };
  state.customerId += 1; state.lastStyle = null; state.streak = 0; state.chain = []; state.lastMash = 0; state.rhythm = 0; state.battle = t.type === "hot" ? rf(38, 48) : 0;
  buildHand(state.active);
  addLog(`${t.type === "hot" ? "熱血客" : "通常客"}「${t.name}」来店。${t.type === "hot" ? "55%以上の熱気制圧が必要。" : "フェーズ一致カードが有効。"}`);
  updateUi();
}

function step(dt: number): void {
  if (!state.running) return;
  state.elapsed += dt; state.timeLeft = Math.max(0, state.timeLeft - dt);
  if (state.timeLeft <= 0) { finishGame(); return; }

  state.lock = Math.max(0, state.lock - dt); state.stun = Math.max(0, state.stun - dt);
  state.fuel = clamp(state.fuel + (state.stun > 0 ? 6.2 : 11.3) * dt, 0, 100);
  state.insight = clamp(state.insight - 2.4 * dt, 0, 100);
  cards.forEach((x) => { state.cd[x.id] = Math.max(0, state.cd[x.id] - dt); });

  const c = state.active;
  if (!c) { spawnCustomer(); return; }
  c.phaseLeft -= dt;
  if (c.phaseLeft <= 0) { c.phase = (c.phase + 1) % c.t.phases.length; c.phaseLeft = rf(4.5, 6.8); addLog(`話題変化: ${phaseOf(c).topic}`); }

  const p = phaseOf(c);
  let heat = c.t.heatRate + p.heat;
  if (c.t.type === "hot") { heat += (100 - state.battle) * 0.012; state.battle = clamp(state.battle - dt * 9.4, 0, 100); state.rhythm = clamp(state.rhythm - dt * 19, 0, 100); }
  c.temp += heat * dt;

  let drain = p.drain;
  if (state.streak >= 3) drain += 0.08;
  c.patience -= drain * dt;

  if (c.t.type === "hot" && state.battle <= 0) c.failPressure += dt;
  else c.failPressure = Math.max(0, c.failPressure - dt * 0.75);

  if (c.patience <= 0) { failOrder("待ちくたびれて退店", false); return; }
  if (c.temp >= 46) { failOrder("熱気で酒温が暴走", true); return; }
  if (c.failPressure >= 3.1) { failOrder("熱気に飲み込まれて会話不能", true); return; }

  updateUi();
}

function matchSeq(seq: Style[]): boolean {
  if (state.chain.length < seq.length) return false;
  const r = state.chain.slice(-seq.length);
  for (let i = 0; i < seq.length; i += 1) if (r[i].style !== seq[i]) return false;
  return true;
}

function applyRecipes(c: Active): void {
  state.chain = state.chain.filter((x) => state.elapsed - x.at <= 7.2);
  for (const rc of recipes) {
    if (!matchSeq(rc.seq)) continue;
    c.temp -= rc.cool; state.score += rc.score; state.insight = clamp(state.insight + rc.insight, 0, 100); state.combo += 1; state.chain = [];
    addLog(`連携成立「${rc.name}」: -${rc.cool.toFixed(1)}℃`);
    break;
  }
}

function useCard(index: number): void {
  if (!state.running || state.stun > 0 || state.lock > 0) return;
  const c = state.active; if (!c) return;
  const card = state.hand[index]; if (!card) return;

  if (state.cd[card.id] > 0.01) { ui.statusLine.textContent = `「${card.name}」はCD中 (${state.cd[card.id].toFixed(1)}s)`; return; }
  if (state.fuel < card.cost) {
    c.temp += 0.9; c.patience -= 0.4; state.insight = clamp(state.insight - 3, 0, 100); state.combo = Math.max(0, state.combo - 1);
    addLog(`燃料不足で「${card.name}」不発`); updateUi(); return;
  }

  state.lock = 0.34; state.fuel = clamp(state.fuel - card.cost, 0, 100); state.cd[card.id] = card.cd;
  const p = phaseOf(c);
  const used = c.styleUse[card.style];
  const phaseHit = p.prefers.includes(card.style);
  const weakHit = c.t.weak.includes(card.style);
  const resist = c.t.resist.includes(card.style);

  let cool = card.power;
  cool *= phaseHit ? 1.35 : 0.82;
  if (weakHit) cool *= 1.28;
  if (resist) cool *= 0.62;
  cool *= Math.max(0.5, 1 - used * 0.17 - (state.lastStyle === card.style ? 0.09 : 0));
  if (c.t.type === "hot") cool *= 0.74 + state.battle * 0.0058;
  if (state.insight >= 70 && phaseHit) cool += 1.2;

  let bad = card.risk;
  bad *= phaseHit ? 0.62 : 1.25;
  if (resist) bad *= 1.35;
  if (used >= 2) bad *= 1.2;

  c.temp = clamp(c.temp - cool + bad * 0.42, -24, 60);
  c.patience = clamp(c.patience - (phaseHit ? 0.1 : 0.72) - (resist ? 0.82 : 0), 0, c.maxPatience);
  if (card.style === "empathy" && (p.cues.includes("romance") || p.cues.includes("victim"))) c.patience = clamp(c.patience + 0.95, 0, c.maxPatience);
  if (card.style === "silent" && p.cues.includes("hot")) c.temp -= 1.3;

  state.insight = clamp(state.insight + (phaseHit ? 12 : -7) + (weakHit ? 5 : 0) - (resist ? 5 : 0), 0, 100);
  state.score += Math.max(0, Math.floor(cool * 10 + (phaseHit ? 8 : 0) - bad * 2));
  state.combo = phaseHit ? state.combo + 1 : Math.max(0, state.combo - 1);

  state.chain.push({ style: card.style, at: state.elapsed });
  applyRecipes(c);
  c.styleUse[card.style] += 1; c.variety.add(card.style);
  if (state.lastStyle === card.style) state.streak += 1; else { state.streak = 1; state.lastStyle = card.style; }

  addLog(`${card.name} ${phaseHit ? "適合" : "外し"} (${styleName[card.style]}) -${cool.toFixed(1)}℃`);
  replaceCard(index);

  if (c.patience <= 0) { failOrder("皮肉が刺さりすぎて帰宅", false); return; }
  if (c.temp >= 46) { failOrder("煽り返されて酒温暴走", true); return; }
  updateUi();
}

function mashUo(): void {
  if (!state.running || state.stun > 0 || state.lock > 0) return;
  const c = state.active; if (!c || c.t.type !== "hot") return;
  if (state.fuel < 4) { ui.statusLine.textContent = "燃料不足で『うおｗ』が弱い"; return; }

  const interval = state.lastMash > 0 ? state.elapsed - state.lastMash : 0.24;
  state.lastMash = state.elapsed; state.fuel = clamp(state.fuel - 4, 0, 100); state.lock = 0.04;

  let grade = 35, gain = 2.2, cool = 0.45, patPenalty = 0;
  if (interval >= 0.14 && interval <= 0.32) { grade = 100; gain = 8.4; cool = 1.7; state.score += 5; }
  else if (interval > 0.32 && interval <= 0.52) { grade = 72; gain = 5.4; cool = 1.0; state.score += 3; }
  else if (interval < 0.1) { grade = 12; gain = 0.7; cool = -0.8; patPenalty = 0.78; state.combo = Math.max(0, state.combo - 1); }
  else if (interval > 0.75) { grade = 18; gain = 1.0; cool = 0.0; }

  state.rhythm = grade; state.battle = clamp(state.battle + gain, 0, 100);
  c.temp = clamp(c.temp - cool, -24, 60);
  c.patience = clamp(c.patience - patPenalty, 0, c.maxPatience);

  if (grade >= 95 && Math.random() < 0.18) addLog("うおｗリズム成功: 熱気を押し返した");
  if (grade <= 15) addLog("連打しすぎで空振り。テンポが重要");
  if (c.patience <= 0) { failOrder("熱血客が呆れて帰った", true); return; }
  updateUi();
}

function serveCurrent(): void {
  if (!state.running || state.stun > 0 || state.lock > 0) return;
  const c = state.active; if (!c) return;
  const hotOk = c.t.type !== "hot" || state.battle >= 55;
  const coldOk = c.temp <= c.target;
  if (!coldOk) { failOrder("冷却不足で提供失敗", c.t.type === "hot"); return; }
  if (!hotOk) { failOrder("熱気ゲージ不足で提供できず", true); return; }

  const gain = c.t.base + c.variety.size * 22 + Math.floor(state.insight * 2) + state.combo * 11 + Math.floor(state.timeLeft * (c.t.type === "hot" ? 0.95 : 0.7)) + (c.temp <= c.target - 4 ? 80 : 0) + (c.t.type === "hot" ? 220 : 0);
  state.score += gain; state.served += 1; state.combo += c.t.type === "hot" ? 2 : 1; state.timeLeft = Math.min(150, state.timeLeft + (c.t.type === "hot" ? 4.5 : 2.6));
  addLog(`提供成功 +${gain}pt (${c.t.type === "hot" ? "熱血" : "通常"}, 型${c.variety.size}種)`);
  spawnCustomer();
}

function failOrder(reason: string, severe: boolean): void {
  const c = state.active; if (!c) return;
  state.combo = 0; state.insight = clamp(state.insight - 12, 0, 100);
  if (severe || c.t.type === "hot") { state.score = Math.max(0, state.score - 130); state.stun = Math.max(state.stun, 2.8); addLog(`${reason}。熱気に押されて硬直 2.8秒。`); }
  else { state.score = Math.max(0, state.score - 65); addLog(`${reason}。客が帰ってしまった。`); }
  spawnCustomer();
}

function finishGame(): void {
  state.running = false; stopTick(); state.resultScore = Math.floor(state.score);
  ui.finalScore.textContent = String(state.resultScore);
  ui.resultNote.textContent = `提供数 ${state.served} / 最終読解 ${Math.round(state.insight)}%`;
  ui.resultModal.classList.remove("hidden"); ui.startBtn.disabled = false; ui.startBtn.textContent = "もう一度営業";
  ui.statusLine.textContent = "営業終了。結果を保存できます。"; addLog(`営業終了: ${state.resultScore}pt`); updateUi();
}

function saveRanking(): void {
  const name = ui.playerName.value.trim() || "名無し店員";
  const e: Rank = { name, score: state.resultScore, date: new Date().toLocaleDateString("ja-JP") };
  state.ranking = [...state.ranking, e].sort((a, b) => b.score - a.score).slice(0, 10);
  localStorage.setItem(RANK_KEY, JSON.stringify(state.ranking));
  ui.saveBtn.disabled = true; renderRanking(); addLog(`ランキング保存: ${name} (${e.score}pt)`);
}

function loadRanking(): void {
  const raw = localStorage.getItem(RANK_KEY);
  if (!raw) { state.ranking = []; return; }
  try {
    const arr = JSON.parse(raw) as Rank[];
    if (!Array.isArray(arr)) { state.ranking = []; return; }
    state.ranking = arr.filter((x) => typeof x.name === "string" && typeof x.score === "number" && typeof x.date === "string").slice(0, 10);
  } catch { state.ranking = []; }
}

function renderCards(): void {
  ui.cardButtons.innerHTML = "";
  state.hand.forEach((card, i) => {
    const b = document.createElement("button");
    const cd = state.cd[card.id];
    b.type = "button"; b.className = "card-btn";
    b.disabled = !state.running || state.stun > 0 || state.lock > 0 || cd > 0.01;
    b.innerHTML = `<span class="card-title">${i + 1}. ${card.name}</span><span class="card-text">${card.text}</span><span class="card-meta">${styleName[card.style]} | 燃料-${card.cost} | 冷却${card.power.toFixed(1)}${cd > 0.01 ? ` / CD ${cd.toFixed(1)}s` : ""}</span>`;
    b.addEventListener("click", () => useCard(i));
    ui.cardButtons.appendChild(b);
  });
}

function renderLogs(): void {
  ui.logList.innerHTML = "";
  for (const line of state.logs) { const li = document.createElement("li"); li.textContent = line; ui.logList.appendChild(li); }
}

function renderRanking(): void {
  ui.rankingList.innerHTML = "";
  if (state.ranking.length === 0) { const li = document.createElement("li"); li.textContent = "まだ記録がありません"; ui.rankingList.appendChild(li); return; }
  state.ranking.forEach((r) => { const li = document.createElement("li"); li.textContent = `${r.name} - ${r.score}pt (${r.date})`; ui.rankingList.appendChild(li); });
}

function updateUi(): void {
  ui.time.textContent = state.timeLeft.toFixed(1); ui.score.textContent = String(Math.floor(state.score)); ui.combo.textContent = String(state.combo);
  ui.fuel.textContent = String(Math.round(state.fuel)); ui.insight.textContent = String(Math.round(state.insight));
  ui.fuelMeterValue.textContent = `${Math.round(state.fuel)}%`; ui.fuelFill.style.width = `${clamp(state.fuel, 0, 100)}%`;

  const c = state.active;
  const disabled = !state.running || state.stun > 0 || state.lock > 0;
  if (!c) {
    ui.customerName.textContent = "待機中"; ui.customerMood.textContent = "雰囲気: -"; ui.phaseTopic.textContent = "会話フェーズ: -"; ui.customerLine.textContent = "次の客を待っています。";
    ui.orderName.textContent = "-"; ui.tempValue.textContent = "-"; ui.targetValue.textContent = "-"; ui.tempFill.style.width = "0%";
    ui.patienceValue.textContent = "-"; ui.patienceFill.style.width = "0%"; ui.battleValue.textContent = "0%"; ui.battleFill.style.width = "0%"; ui.rhythmValue.textContent = "0%"; ui.rhythmFill.style.width = "0%";
    ui.battleWrap.classList.add("hidden"); ui.rhythmWrap.classList.add("hidden"); ui.hotActions.classList.add("hidden"); ui.serveBtn.disabled = true; ui.uoBtn.disabled = true;
    renderCards(); return;
  }

  const p = phaseOf(c);
  ui.typeBadge.textContent = c.t.type === "hot" ? "熱血客" : "通常客";
  ui.typeBadge.className = c.t.type === "hot" ? "badge hot" : "badge normal";
  ui.customerName.textContent = c.t.name; ui.customerMood.textContent = `雰囲気: ${c.t.mood}`;
  ui.phaseTopic.textContent = `会話フェーズ: ${p.topic} (${c.phaseLeft.toFixed(1)}s)`;
  ui.customerLine.textContent = `「${p.line}」`; ui.orderName.textContent = c.t.order;
  ui.tempValue.textContent = `${c.temp.toFixed(1)}℃`; ui.targetValue.textContent = `${c.target.toFixed(1)}℃`;
  ui.tempFill.style.width = `${clamp(((c.temp + 24) / 70) * 100, 0, 100)}%`;
  const pat = clamp((c.patience / c.maxPatience) * 100, 0, 100);
  ui.patienceValue.textContent = `${Math.round(pat)}%`; ui.patienceFill.style.width = `${pat}%`;
  ui.battleValue.textContent = `${Math.round(state.battle)}%`; ui.battleFill.style.width = `${clamp(state.battle, 0, 100)}%`;
  ui.rhythmValue.textContent = `${Math.round(state.rhythm)}%`; ui.rhythmFill.style.width = `${clamp(state.rhythm, 0, 100)}%`;

  const hot = c.t.type === "hot";
  ui.battleWrap.classList.toggle("hidden", !hot); ui.rhythmWrap.classList.toggle("hidden", !hot); ui.hotActions.classList.toggle("hidden", !hot);
  ui.uoBtn.disabled = disabled || !hot || state.fuel < 4; ui.serveBtn.disabled = disabled || !state.running;

  if (!state.running) ui.statusLine.textContent = ui.resultModal.classList.contains("hidden") ? "営業開始でスタート。" : "営業終了。結果を保存できます。";
  else if (state.stun > 0) ui.statusLine.textContent = `熱気で硬直中... ${state.stun.toFixed(1)}秒`;
  else if (hot && state.battle < 55) ui.statusLine.textContent = "熱血客: リズム入力で熱気ゲージ55%以上に維持";
  else if (c.temp > c.target) ui.statusLine.textContent = "フェーズ一致カードで冷却を狙う";
  else ui.statusLine.textContent = "提供可能。温度と熱気条件を満たしている";

  ui.rhythmGuide.textContent = hot && state.rhythm >= 70 ? "良いテンポ。0.14〜0.32秒が最強" : "連打しすぎると逆効果。一定リズムが有効";
  renderCards();
}

function bindEvents(): void {
  ui.startBtn.addEventListener("click", startGame); ui.retryBtn.addEventListener("click", startGame);
  ui.uoBtn.addEventListener("click", mashUo); ui.serveBtn.addEventListener("click", serveCurrent); ui.saveBtn.addEventListener("click", saveRanking);
  document.addEventListener("keydown", (e) => {
    if (e.key === "1") useCard(0);
    else if (e.key === "2") useCard(1);
    else if (e.key === "3") useCard(2);
    else if (e.key === "4") useCard(3);
    else if (e.key === "Enter") serveCurrent();
    else if (e.code === "Space") { e.preventDefault(); mashUo(); }
  });
}

function init(): void { state.cd = initCd(); loadRanking(); renderRanking(); renderLogs(); bindEvents(); updateUi(); }
init();

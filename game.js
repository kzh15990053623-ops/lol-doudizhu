const RANKS = [
  { key: "3", value: 3 },
  { key: "4", value: 4 },
  { key: "5", value: 5 },
  { key: "6", value: 6 },
  { key: "7", value: 7 },
  { key: "8", value: 8 },
  { key: "9", value: 9 },
  { key: "10", value: 10 },
  { key: "J", value: 11 },
  { key: "Q", value: 12 },
  { key: "K", value: 13 },
  { key: "A", value: 14 },
  { key: "2", value: 15 },
];

const SUITS = [
  { key: "♠", red: false },
  { key: "♥", red: true },
  { key: "♣", red: false },
  { key: "♦", red: true },
];

const HEROES = [
  {
    id: "garen",
    name: "盖伦",
    city: "德玛西亚",
    mark: "D",
    color: "#2d5369",
    skill: "审判：下一次你出的单牌或对子点数 +1，仅用于比较大小。",
    field: "坚毅阵线：地主第一次被压制时，自动获得一次免过，继续保留行动权。",
  },
  {
    id: "darius",
    name: "德莱厄斯",
    city: "诺克萨斯",
    mark: "N",
    color: "#653038",
    skill: "诺克萨斯断头台：本轮压过别人后，立刻弃掉自己 1 张最小手牌。",
    field: "铁血竞技：每出现一次炸弹或火箭，结算倍率额外 +1。",
  },
  {
    id: "ashe",
    name: "艾希",
    city: "弗雷尔卓德",
    mark: "F",
    color: "#345b78",
    skill: "魔法水晶箭：冻结一名对手，使其下一次只能出单牌或过牌。",
    field: "极寒律令：每轮第一个出牌的人不能首出炸弹。",
  },
  {
    id: "jinx",
    name: "金克丝",
    city: "祖安",
    mark: "Z",
    color: "#6d365f",
    skill: "超究极死神飞弹：你的一组三张 3-10 本次可当炸弹打出。",
    field: "失控爆燃：炸弹出现后，下一名玩家不能过牌。",
  },
  {
    id: "caitlyn",
    name: "凯特琳",
    city: "皮尔特沃夫",
    mark: "P",
    color: "#5a4d78",
    skill: "让子弹飞：查看一名对手随机 3 张手牌。",
    field: "执法视野：地主每回合第一次过牌后，查看当前最大牌型。",
  },
  {
    id: "yasuo",
    name: "亚索",
    city: "艾欧尼亚",
    mark: "I",
    color: "#4b6844",
    skill: "踏前斩：下一次顺子允许存在 1 个缺口。",
    field: "流风之地：顺子和连对的最小长度要求 -1，所有玩家可用。",
  },
  {
    id: "thresh",
    name: "锤石",
    city: "暗影岛",
    mark: "S",
    color: "#2f685f",
    skill: "魂引之灯：从弃牌区拿 1 张 3-10 的牌加入手牌。",
    field: "魂锁典狱：任意玩家第一次剩 3 张牌时，公开触发警告。",
  },
  {
    id: "azir",
    name: "阿兹尔",
    city: "恕瑞玛",
    mark: "A",
    color: "#806b33",
    skill: "沙兵现身：选择一张手牌，本次视为与你另一张牌同点数。",
    field: "帝国军阵：地主首轮可在三带中多带或少带 1 张。",
  },
  {
    id: "pantheon",
    name: "潘森",
    city: "巨神峰",
    mark: "T",
    color: "#5e5e79",
    skill: "星陨冲击：本轮你可以用对子压制单牌，按对子点数比较。",
    field: "不屈天穹：地主首次剩余 5 张牌以下时，获得一次不能被炸弹压制的护盾。",
  },
  {
    id: "missfortune",
    name: "厄运小姐",
    city: "比尔吉沃特",
    mark: "B",
    color: "#874336",
    skill: "枪林弹雨：随机从两名对手各抽 1 张，再各还 1 张。",
    field: "海盗分赃：两名农民都过牌后，地主可弃 1 张最小手牌。",
  },
  {
    id: "teemo",
    name: "提莫",
    city: "班德尔城",
    mark: "Y",
    color: "#536d37",
    skill: "种蘑菇：标记一名对手，其下次出牌后随机弃掉 1 张 3-10。",
    field: "约德尔恶作剧：每轮最后过牌的人，下轮第一次行动不能使用技能。",
  },
  {
    id: "kaisa",
    name: "卡莎",
    city: "虚空",
    mark: "V",
    color: "#573c72",
    skill: "虚空索敌：吞噬自己 1 张单牌，手牌 -1，但结算倍率 -1。",
    field: "虚空干扰：地主首次少于 5 张牌时，随机一名农民下次不能出炸弹。",
  },
];

const VOICE_LINES = {
  garen: ["assets/voice/garen.ogg", "assets/voice/garen.mp3"],
  darius: ["assets/voice/darius.mp3"],
  ashe: ["assets/voice/ashe.ogg", "assets/voice/ashe.mp3"],
  jinx: ["assets/voice/jinx.mp3"],
  caitlyn: [],
  yasuo: ["assets/voice/yasuo.mp3"],
  thresh: ["assets/voice/thresh.ogg", "assets/voice/thresh.mp3"],
  azir: [],
  pantheon: [],
  missfortune: [],
  teemo: [],
  kaisa: [],
};

const SKILL_NAMES = {
  garen: "审判",
  darius: "诺克萨斯断头台",
  ashe: "魔法水晶箭",
  jinx: "超究极死神飞弹",
  caitlyn: "让子弹飞",
  yasuo: "踏前斩",
  thresh: "魂引之灯",
  azir: "沙兵现身",
  pantheon: "星陨冲击",
  missfortune: "枪林弹雨",
  teemo: "种蘑菇",
  kaisa: "虚空索敌",
};

const GUIDE_STEPS = [
  {
    title: "三人牌桌",
    body: "你在底部，两个 AI 在左右上方。中央是出牌区，上一手牌和当前目标都会显示在牌桌中间。",
  },
  {
    title: "抢地主",
    body: "抢地主没有叫分。点击“抢地主”会直接成为地主，并获得三张底牌；其他玩家自动成为农民。",
  },
  {
    title: "英雄技能",
    body: "每个英雄只有一个主动技能。点击技能图标可以查看效果；轮到你时，底部“技能”按钮可以发动。",
  },
  {
    title: "地主城邦被动",
    body: "地主会激活自己英雄绑定的城邦被动。被动触发时，城邦卡会发光，并出现局内提示。",
  },
  {
    title: "出牌目标",
    body: "中央会提示当前需要压过的牌型。不能出牌、不能过牌或被技能限制时，会出现轻提示，不会打断牌局。",
  },
];

const state = {
  phase: "hero",
  players: [],
  bottom: [],
  selected: new Set(),
  turn: 0,
  landlord: null,
  current: null,
  history: [],
  passes: 0,
  multiplier: 1,
  log: [],
  discard: [],
  firstLeadOfRound: true,
  forcedNoPass: false,
  fieldFlags: {},
  winner: null,
  voiceHint: "",
  aiThinking: null,
  aiTimer: null,
  aiCueTimer: null,
  hintCycle: {
    key: "",
    index: -1,
  },
  guideStep: 0,
  catalogHeroId: HEROES[0].id,
  settings: {
    muted: false,
    volume: 0.85,
    aiSpeed: "normal",
  },
};

const el = (id) => document.getElementById(id);

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function makeDeck() {
  let id = 0;
  const deck = [];
  for (const rank of RANKS) {
    for (const suit of SUITS) {
      deck.push({ id: id++, rank: rank.key, value: rank.value, suit: suit.key, red: suit.red });
    }
  }
  deck.push({ id: id++, rank: "小王", value: 16, suit: "", red: false, joker: true });
  deck.push({ id: id++, rank: "大王", value: 17, suit: "", red: true, joker: true });
  return shuffle(deck);
}

function sortHand(hand) {
  hand.sort((a, b) => a.value - b.value || a.suit.localeCompare(b.suit));
}

function log(message) {
  state.log.unshift(message);
  state.log = state.log.slice(0, 80);
  renderLog();
}

function showEvent(message, type = "info", options = {}) {
  const toast = el("eventToast");
  if (!toast) return;
  toast.textContent = message;
  toast.className = `event-toast ${type}`;
  window.clearTimeout(showEvent.timer);
  if (options.seat !== undefined) markSeatFeedback(options.seat, options.seatType ?? type);
  if (options.city) markCityFeedback();
  if (options.center) {
    markCenterFeedback(type);
    showTableCue(options.centerText ?? message, type, options.duration);
  }
  window.setTimeout(() => toast.classList.add("show"), 20);
  showEvent.timer = window.setTimeout(() => {
    toast.classList.remove("show");
    toast.classList.add("hidden");
  }, options.duration ?? 1900);
}

function showTableCue(message, type = "info", duration = 1500) {
  const cue = el("tableCue");
  if (!cue) return;
  cue.textContent = message;
  cue.className = `table-cue ${type}`;
  window.clearTimeout(showTableCue.timer);
  window.setTimeout(() => cue.classList.add("show"), 20);
  showTableCue.timer = window.setTimeout(() => {
    cue.classList.remove("show");
    cue.classList.add("hidden");
  }, Math.min(duration ?? 1500, 2200));
}

function markSeatFeedback(playerId, type = "info") {
  const seat = el(`player${playerId}`);
  if (!seat) return;
  markSeatFeedback.timers ??= {};
  window.clearTimeout(markSeatFeedback.timers[playerId]);
  seat.classList.remove("event-hit", "event-skill", "event-pass", "event-beat", "event-round");
  void seat.offsetWidth;
  const className =
    type === "skill"
      ? "event-skill"
      : type === "pass"
        ? "event-pass"
        : type === "beat"
          ? "event-beat"
          : type === "round"
            ? "event-round"
            : "event-hit";
  seat.classList.add(className);
  markSeatFeedback.timers[playerId] = window.setTimeout(() => {
    seat.classList.remove("event-hit", "event-skill", "event-pass", "event-beat", "event-round");
    delete markSeatFeedback.timers[playerId];
  }, 900);
}

function markCityFeedback() {
  const city = document.querySelector(".city-panel");
  if (!city) return;
  city.classList.remove("passive-triggered");
  void city.offsetWidth;
  city.classList.add("passive-triggered");
  window.setTimeout(() => city.classList.remove("passive-triggered"), 1300);
}

function markCenterFeedback(type = "info") {
  const table = document.querySelector(".center-play");
  if (!table) return;
  table.classList.remove("event-play", "event-pass", "event-warning", "event-beat", "event-round");
  void table.offsetWidth;
  const className =
    type === "pass"
      ? "event-pass"
      : type === "warning"
        ? "event-warning"
        : type === "beat"
          ? "event-beat"
          : type === "round"
            ? "event-round"
            : "event-play";
  table.classList.add(className);
  window.setTimeout(() => table.classList.remove("event-play", "event-pass", "event-warning", "event-beat", "event-round"), 900);
}

function showPassiveEvent(title, message, targetId) {
  log(message);
  window.setTimeout(() => {
    showEvent(`已触发：${title}`, "passive", { city: true, center: true, seat: targetId, duration: 2200 });
  }, 180);
}

function showLandlordReveal(player) {
  const reveal = el("landlordReveal");
  if (!reveal) return;
  el("landlordRevealPortrait").setAttribute("style", avatarStyle(player.hero));
  el("landlordRevealTitle").textContent = `${player.name} · ${player.hero.city}`;
  el("landlordRevealText").textContent = `${player.hero.name} 成为地主，城邦被动已激活`;
  el("landlordRevealCards").innerHTML = state.bottom.map((card) => renderPlayingCard(card)).join("");
  reveal.classList.remove("hidden", "play");
  void reveal.offsetWidth;
  reveal.classList.add("play");
  document.querySelector(".city-panel")?.classList.add("landlord-confirmed");
  window.clearTimeout(showLandlordReveal.timer);
  showLandlordReveal.timer = window.setTimeout(() => {
    reveal.classList.add("hidden");
    reveal.classList.remove("play");
    document.querySelector(".city-panel")?.classList.remove("landlord-confirmed");
  }, 1850);
}

function mechanicSummary(text) {
  return text.split("：").slice(1).join("：").replace(/[。；].*$/, "").trim() || text;
}

function setupHeroSelect() {
  const choices = shuffle(HEROES).slice(0, 3);
  el("heroSelect").innerHTML = choices
    .map(
      (hero) => `
      <article class="hero-card hero-choice-card" style="--hero-color:${hero.color}" data-mark="${hero.mark}" tabindex="0">
        <div class="hero-card-top">
          <div>
            <p class="eyebrow">随机三选一</p>
            <h2>${hero.name}</h2>
            <div class="city">${hero.city}</div>
          </div>
          <div class="hero-portrait large" style="${avatarStyle(hero)}"></div>
        </div>
        <div class="hero-summary">
          <span>主动</span>
          <strong>${SKILL_NAMES[hero.id] ?? "主动技能"}</strong>
          <p>${mechanicSummary(hero.skill)}</p>
        </div>
        <div class="hero-summary passive">
          <span>地主城邦</span>
          <strong>${hero.city}</strong>
          <p>${mechanicSummary(hero.field)}</p>
        </div>
        <div class="hero-detail-reveal" aria-label="${hero.name}完整机制说明">
          <b>${hero.name} · 完整机制</b>
          <p><strong>主动</strong>：${hero.skill}</p>
          <p><strong>地主城邦被动</strong>：${hero.field}</p>
        </div>
        <button class="primary" data-pick="${hero.id}">选择 ${hero.name}</button>
      </article>
    `,
    )
    .join("");
  document.querySelectorAll("[data-pick]").forEach((button) => {
    button.addEventListener("click", () => startGame(button.dataset.pick));
  });
}

function startGame(heroId) {
  const deck = makeDeck();
  const heroes = [HEROES.find((hero) => hero.id === heroId), ...shuffle(HEROES.filter((hero) => hero.id !== heroId)).slice(0, 2)];
  state.players = [0, 1, 2].map((index) => ({
    id: index,
    name: index === 0 ? "你" : `AI ${index}`,
    hero: heroes[index],
    hand: deck.slice(index * 17, index * 17 + 17),
    role: "农民",
    usedSkill: false,
    buff: {},
    warnedThree: false,
  }));
  state.bottom = deck.slice(51);
  state.players.forEach((player) => sortHand(player.hand));
  state.phase = "bid";
  state.turn = 0;
  state.landlord = null;
  state.current = null;
  state.history = [];
  state.passes = 0;
  state.discard = [];
  state.winner = null;
  state.fieldFlags = {};
  state.multiplier = 1;
  state.voiceHint = "";
  clearAiThinking();
  resetHintCycle();
  state.selected.clear();
  el("heroSelect").classList.add("hidden");
  el("gameBoard").classList.remove("hidden");
  el("bidActions").classList.remove("hidden");
  el("playActions").classList.add("hidden");
  log(`你选择了 ${heroes[0].name}，另外两名玩家分别选择 ${heroes[1].name}、${heroes[2].name}。`);
  log("开始抢地主。");
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function userBid(call) {
  if (call) {
    setLandlord(0);
    return;
  }
  log("你选择不抢。");
  const aiBidder = [1, 2].find((id) => evaluateBid(state.players[id]));
  setLandlord(aiBidder ?? 1 + Math.floor(Math.random() * 2));
}

function evaluateBid(player) {
  const high = player.hand.filter((card) => card.value >= 14).length;
  const bombs = countGroups(player.hand).filter((group) => group.cards.length === 4).length;
  return high + bombs * 2 >= 5 || Math.random() > 0.62;
}

function setLandlord(id) {
  state.landlord = id;
  state.players.forEach((player) => {
    player.role = player.id === id ? "地主" : "农民";
  });
  state.players[id].hand.push(...state.bottom);
  sortHand(state.players[id].hand);
  state.phase = "play";
  state.turn = id;
  state.current = null;
  state.history = [];
  state.passes = 0;
  state.firstLeadOfRound = true;
  el("bidActions").classList.add("hidden");
  el("playActions").classList.remove("hidden");
  log(`${state.players[id].name} 成为地主，${state.players[id].hero.city} 场地激活。`);
  showEvent(`${state.players[id].name} 成为地主，${state.players[id].hero.city} 激活`, "passive", { city: true, seat: id, duration: 2200 });
  render();
  showLandlordReveal(state.players[id]);
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (id !== 0) scheduleAiTurn();
}

function countGroups(cards) {
  const map = new Map();
  cards.forEach((card) => {
    if (!map.has(card.value)) map.set(card.value, []);
    map.get(card.value).push(card);
  });
  return [...map.entries()].map(([value, groupCards]) => ({ value, cards: groupCards }));
}

function isConsecutive(values, minLength, allowGap = false) {
  const sorted = [...new Set(values)].sort((a, b) => a - b);
  if (sorted.length < minLength || sorted.some((value) => value >= 15)) return false;
  let gaps = 0;
  for (let i = 1; i < sorted.length; i += 1) gaps += sorted[i] - sorted[i - 1] - 1;
  return allowGap ? gaps <= 1 : gaps === 0;
}

function classify(cards, player, options = {}) {
  const sorted = [...cards].sort((a, b) => a.value - b.value);
  const values = sorted.map((card) => card.value);
  const groups = countGroups(sorted).sort((a, b) => a.cards.length - b.cards.length || a.value - b.value);
  const size = sorted.length;
  const fieldHero = state.landlord !== null ? state.players[state.landlord].hero.id : null;
  const shortRuns = fieldHero === "yasuo";
  const allowGap = Boolean(player?.buff.yasuo || options.allowGap);

  if (size === 1) return { type: "single", value: values[0], length: 1, label: "单牌" };
  if (size === 2 && values.includes(16) && values.includes(17)) return { type: "rocket", value: 99, length: 2, label: "火箭" };
  if (size === 2 && groups.length === 1 && player?.buff.azir) return { type: "triple", value: values[0], length: 3, label: "沙兵三张" };
  if (size === 2 && groups.length === 1 && player?.buff.pantheonPairBeatsSingle) {
    return { type: "single", value: values[0], length: 1, label: "星陨对子" };
  }
  if (size === 2 && groups.length === 1) return { type: "pair", value: values[0], length: 2, label: "对子" };
  if (size === 3 && groups.length === 1) {
    if (player?.buff.jinxBomb && values[0] <= 10) return { type: "bomb", value: values[0], length: 4, label: "金克丝炸弹" };
    return { type: "triple", value: values[0], length: 3, label: "三张" };
  }
  if (size === 4 && groups.length === 1) return { type: "bomb", value: values[0], length: 4, label: "炸弹" };
  if (size === 4 && groups.some((group) => group.cards.length === 3)) {
    return { type: "tripleSolo", value: groups.find((group) => group.cards.length === 3).value, length: 4, label: "三带一" };
  }
  if (size === 5 && groups.length === 2 && groups.some((group) => group.cards.length === 3) && groups.some((group) => group.cards.length === 2)) {
    return { type: "triplePair", value: groups.find((group) => group.cards.length === 3).value, length: 5, label: "三带二" };
  }
  if (size >= (shortRuns ? 4 : 5) && groups.every((group) => group.cards.length === 1) && isConsecutive(values, shortRuns ? 4 : 5, allowGap)) {
    return { type: "straight", value: Math.max(...values), length: size, label: allowGap ? "踏前顺子" : "顺子" };
  }
  if (size >= (shortRuns ? 4 : 6) && size % 2 === 0 && groups.every((group) => group.cards.length === 2) && isConsecutive(groups.map((group) => group.value), shortRuns ? 2 : 3, false)) {
    return { type: "pairSeq", value: Math.max(...groups.map((group) => group.value)), length: size, label: "连对" };
  }
  return null;
}

function applyComparisonBuff(combo, player) {
  const adjusted = { ...combo };
  if (player.buff.garen && (combo.type === "single" || combo.type === "pair")) {
    adjusted.value += 1;
    adjusted.label += " +1";
  }
  return adjusted;
}

function canBeat(combo, current, player) {
  if (!combo) return false;
  if (!current) return true;
  if (player.buff.noBomb && (combo.type === "bomb" || combo.type === "rocket")) return false;
  if (combo.type === "rocket") return current.combo.type !== "rocket";
  if (current.combo.type === "rocket") return false;
  if (combo.type === "bomb" && current.combo.type !== "bomb") {
    if (state.players[state.landlord]?.buff.pantheonShield) return false;
    return true;
  }
  if (current.combo.type === "bomb" && combo.type !== "bomb") return false;
  return combo.type === current.combo.type && combo.length === current.combo.length && combo.value > current.combo.value;
}

function selectedCards() {
  return state.players[0].hand.filter((card) => state.selected.has(card.id));
}

function getUserSelectionResult() {
  if (state.turn !== 0 || state.phase !== "play" || !state.players.length) {
    return { cards: [], combo: null, legal: false, reason: "还没轮到你行动" };
  }
  const player = state.players[0];
  const cards = selectedCards();
  if (!cards.length) return { cards, combo: null, legal: false, reason: "请选择要出的牌" };
  const raw = classify(cards, player);
  const combo = raw ? applyComparisonBuff(raw, player) : null;
  if (!combo) return { cards, combo: null, legal: false, reason: "不是合法牌型" };
  if (player.buff.frozen && combo.type !== "single") {
    return { cards, combo, legal: false, reason: "被冻结：这次只能出单牌或过牌" };
  }
  if (
    state.firstLeadOfRound &&
    state.landlord !== null &&
    state.players[state.landlord].hero.id === "ashe" &&
    (combo.type === "bomb" || combo.type === "rocket")
  ) {
    return { cards, combo, legal: false, reason: "极寒律令：每轮首出不能打炸弹" };
  }
  if (!canBeat(combo, state.current, player)) {
    return { cards, combo, legal: false, reason: "不能出牌：请选择合法牌型并压过当前牌" };
  }
  return { cards, combo, legal: true, reason: "" };
}

function userPlay() {
  if (state.turn !== 0 || state.phase !== "play") return;
  const result = getUserSelectionResult();
  if (!result.legal) {
    return showEvent(result.reason, "warning", {
      center: true,
      seat: 0,
      city: result.reason.includes("极寒律令"),
    });
  }
  completePlay(0, result.cards, result.combo);
}

function userPass() {
  if (state.turn !== 0 || state.phase !== "play") return;
  if (!state.current) return showEvent("不能过牌：你是本轮首家，需要出牌", "warning", { center: true, seat: 0 });
  if (state.forcedNoPass) return showEvent("不能过牌：祖安场地要求必须出牌", "warning", { center: true, city: true });
  passTurn(0);
}

function suggestUserPlay() {
  if (state.turn !== 0 || state.phase !== "play") return showEvent("还没轮到你行动", "warning", { center: true });
  const player = state.players[0];
  const candidates = chooseSuggestedPlays(player);
  state.selected.clear();
  if (!candidates.length) {
    resetHintCycle();
    render();
    return showEvent(state.current ? "没有可压过的牌，可以选择不要" : "暂无可用提示", "warning", { center: true, seat: 0 });
  }
  const key = hintCycleKey(player);
  const nextIndex = state.hintCycle.key === key ? (state.hintCycle.index + 1) % candidates.length : 0;
  state.hintCycle = { key, index: nextIndex };
  const candidate = candidates[nextIndex];
  candidate.cards.forEach((card) => state.selected.add(card.id));
  render();
  const action = state.current ? "建议压制" : "建议首出";
  const countLabel = candidates.length > 1 ? ` ${nextIndex + 1}/${candidates.length}` : "";
  showEvent(`${action}${countLabel}：${candidate.combo.label}`, "info", {
    center: true,
    seat: 0,
    centerText: `${action}${countLabel}：${candidate.combo.label} · ${formatCards(candidate.cards)}`,
  });
}

function chooseSuggestedPlays(player) {
  const legal = generateCandidates(player).filter((candidate) => {
    if (player.buff.frozen && candidate.combo.type !== "single") return false;
    if (
      state.firstLeadOfRound &&
      state.landlord !== null &&
      state.players[state.landlord].hero.id === "ashe" &&
      (candidate.combo.type === "bomb" || candidate.combo.type === "rocket")
    ) {
      return false;
    }
    return canBeat(candidate.combo, state.current, player);
  });
  return dedupeSuggestions(legal);
}

function hintCycleKey(player) {
  const currentKey = state.current
    ? `${state.current.player}:${state.current.combo.type}:${state.current.combo.value}:${state.current.combo.length}:${state.current.cards.map((card) => card.id).join(",")}`
    : "lead";
  const handKey = player.hand.map((card) => card.id).join(",");
  const buffKey = Object.keys(player.buff)
    .sort()
    .map((key) => `${key}:${player.buff[key]}`)
    .join("|");
  return `${state.phase}:${state.turn}:${currentKey}:${state.firstLeadOfRound}:${handKey}:${buffKey}`;
}

function dedupeSuggestions(candidates) {
  const seen = new Set();
  return candidates.filter((candidate) => {
    const values = candidate.cards
      .map((card) => card.value)
      .sort((a, b) => a - b)
      .join("-");
    const key = `${candidate.combo.type}:${candidate.combo.value}:${candidate.combo.length}:${values}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function resetHintCycle() {
  state.hintCycle = { key: "", index: -1 };
}

function clearUserSelection() {
  if (!state.selected.size) return;
  state.selected.clear();
  resetHintCycle();
  render();
  showEvent("已重置选牌", "info", { seat: 0 });
}

function closeSkillTooltips() {
  const openItems = [...document.querySelectorAll(".skill-button-wrap.open")];
  openItems.forEach((item) => {
    item.classList.remove("open");
    item.querySelector(".hero-skill-button")?.setAttribute("aria-expanded", "false");
  });
  return openItems.length > 0;
}

function handleGlobalClick(event) {
  if (event.target.closest?.(".skill-button-wrap")) return;
  closeSkillTooltips();
}

function isOverlayOpen() {
  return Boolean(
    el("modal")?.open ||
      !el("guideOverlay")?.classList.contains("hidden") ||
      !el("catalogOverlay")?.classList.contains("hidden") ||
      !el("settingsOverlay")?.classList.contains("hidden"),
  );
}

function handleKeyboardShortcuts(event) {
  if (event.defaultPrevented || isOverlayOpen()) return;
  const target = event.target;
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return;
  if (state.phase === "bid") {
    if (event.key === "Enter" && !el("callBidBtn").disabled) {
      event.preventDefault();
      userBid(true);
    } else if ((event.key === " " || event.key === "Escape") && !el("skipBidBtn").disabled) {
      event.preventDefault();
      userBid(false);
    }
    return;
  }
  if (state.phase !== "play" || state.turn !== 0) return;
  const key = event.key.toLowerCase();
  if (key === "h" && !el("hintBtn").disabled) {
    event.preventDefault();
    suggestUserPlay();
  } else if (event.key === "Enter" && !el("playBtn").disabled) {
    event.preventDefault();
    userPlay();
  } else if (event.key === " " && !el("passBtn").disabled) {
    event.preventDefault();
    userPass();
  } else if (event.key === "Escape" && closeSkillTooltips()) {
    event.preventDefault();
  } else if (event.key === "Escape" && !el("clearSelectionBtn").disabled) {
    event.preventDefault();
    clearUserSelection();
  } else if (key === "s" && !el("skillBtn").disabled) {
    event.preventDefault();
    useUserSkill();
  }
}

function completePlay(playerId, cards, combo) {
  const player = state.players[playerId];
  const previous = state.current;
  const beatPrevious = Boolean(previous && previous.player !== playerId);
  player.hand = player.hand.filter((card) => !cards.some((used) => used.id === card.id));
  state.discard.push(...cards);
  state.current = { player: playerId, cards, combo };
  addHistory(playerId, combo.label, cards, {
    kind: beatPrevious ? "beat" : "play",
    targetId: previous?.player ?? null,
  });
  state.passes = 0;
  state.firstLeadOfRound = false;
  state.selected.clear();
  resetHintCycle();
  clearSingleUseBuffs(player);
  handleAfterPlay(playerId, cards, combo, beatPrevious, previous);
  log(`${player.name} 打出 ${combo.label}：${formatCards(cards)}。`);
  const playFeedback = describePlayFeedback(player, cards, combo, previous, beatPrevious);
  if (player.hand.length === 0) return endGame(playerId);
  checkFieldWarnings(player);
  state.turn = getNextTurnAfterPlay(playerId, previous);
  render();
  if (state.turn !== 0) scheduleAiTurn();
  showEvent(playFeedback.toast, playFeedback.type, {
    center: true,
    seat: playerId,
    seatType: "info",
    centerText: playFeedback.center,
    duration: playFeedback.duration,
  });
  if (beatPrevious) markSeatFeedback(previous.player, "beat");
}

function clearSingleUseBuffs(player) {
  delete player.buff.garen;
  delete player.buff.yasuo;
  delete player.buff.jinxBomb;
  delete player.buff.pantheonPairBeatsSingle;
  delete player.buff.skillBlocked;
  delete player.buff.azir;
  delete player.buff.noBomb;
  if (player.buff.frozen) delete player.buff.frozen;
}

function getNextTurnAfterPlay(playerId, previous) {
  const landlord = state.players[state.landlord];
  if (
    landlord?.hero.id === "garen" &&
    previous?.player === state.landlord &&
    playerId !== state.landlord &&
    !state.fieldFlags.garen
  ) {
    state.fieldFlags.garen = true;
    showPassiveEvent("坚毅阵线", "坚毅阵线触发，地主获得一次免过并立即行动。", state.landlord);
    return state.landlord;
  }
  return nextPlayer(playerId);
}

function handleAfterPlay(playerId, cards, combo, beatPrevious, previous) {
  const player = state.players[playerId];
  if (combo.type === "bomb" || combo.type === "rocket") {
    state.multiplier += combo.type === "rocket" ? 2 : 1;
    if (state.players[state.landlord].hero.id === "darius") {
      state.multiplier += 1;
      showPassiveEvent("诺克萨斯威压", "诺克萨斯威压触发，炸弹额外提高倍率。", state.landlord);
    }
    if (state.players[state.landlord].hero.id === "jinx") {
      state.forcedNoPass = true;
      showPassiveEvent("祖安狂热", "祖安狂热触发，炸弹后下一名玩家不能过牌。", state.landlord);
    }
  } else {
    state.forcedNoPass = false;
  }
  if (player.buff.dariusExecute && beatPrevious) {
    if (discardLowest(player, "德莱厄斯处决")) showEvent("德莱厄斯处决：弃掉最小手牌", "skill", { center: true, seat: player.id });
    delete player.buff.dariusExecute;
  }
  if (player.buff.mushroomed) {
    if (discardRandomLow(player, "提莫蘑菇")) showEvent("提莫蘑菇触发：随机弃牌", "skill", { center: true, seat: player.id });
    delete player.buff.mushroomed;
  }
  if (player.id === state.landlord && player.hero.id === "kaisa" && !state.fieldFlags.kaisa && player.hand.length < 5) {
    state.fieldFlags.kaisa = true;
    const target = shuffle(state.players.filter((p) => p.id !== state.landlord))[0];
    target.buff.noBomb = true;
    showPassiveEvent("虚空干扰", `虚空干扰触发，${target.name} 下次不能出炸弹。`, target.id);
  }
  if (player.id === state.landlord && player.hero.id === "pantheon" && !state.fieldFlags.pantheon && player.hand.length < 5) {
    state.fieldFlags.pantheon = true;
    player.buff.pantheonShield = true;
    showPassiveEvent("不屈天穹", "不屈天穹触发，地主获得一次防炸弹护盾。", player.id);
  }
}

function passTurn(playerId) {
  const player = state.players[playerId];
  resetHintCycle();
  if (player.id === state.landlord && player.hero.id === "caitlyn" && !player.buff.caitlynFieldPeek && state.current) {
    player.buff.caitlynFieldPeek = true;
    showPassiveEvent("执法视野", `执法视野：当前最大牌型是 ${state.current.combo.label} ${formatCards(state.current.cards)}。`, player.id);
  }
  log(`${player.name} 过牌。`);
  addHistory(playerId, "过牌", [], { kind: "pass" });
  if (state.players[state.landlord].hero.id === "teemo") {
    player.buff.skillBlocked = true;
    showPassiveEvent("约德尔陷阱", `约德尔陷阱触发，${player.name} 技能暂时禁用。`, player.id);
  }
  state.passes += 1;
  state.forcedNoPass = false;
  let roundFeedback = null;
  if (state.passes >= 2) {
    if (state.players[state.landlord].hero.id === "missfortune" && state.current?.player === state.landlord) {
      if (discardLowest(state.players[state.landlord], "比尔吉沃特分赃")) {
        showPassiveEvent("比尔吉沃特分赃", "比尔吉沃特分赃触发，地主弃掉一张最小手牌。", state.landlord);
      }
    }
    state.turn = state.current.player;
    const leadPlayer = state.players[state.turn];
    state.current = null;
    state.passes = 0;
    state.firstLeadOfRound = true;
    log(`${leadPlayer.name} 获得新一轮出牌权。`);
    addHistory(leadPlayer.id, "重新首出", [], { kind: "round" });
    roundFeedback = {
      toast: `本轮结束：${leadPlayer.name} 重新首出`,
      center: `新一轮 · ${leadPlayer.name} 重新获得出牌权`,
      seat: state.turn,
    };
  } else {
    state.turn = nextPlayer(playerId);
  }
  render();
  if (state.turn !== 0) scheduleAiTurn();
  if (roundFeedback) {
    showEvent(roundFeedback.toast, "round", {
      center: true,
      seat: roundFeedback.seat,
      seatType: "round",
      centerText: roundFeedback.center,
      duration: 2200,
    });
  } else {
    showEvent(`${player.name} 过牌`, "pass", {
      center: true,
      seat: playerId,
      seatType: "pass",
      centerText: `${player.name} 过牌`,
      duration: 1600,
    });
  }
}

function describePlayFeedback(player, cards, combo, previous, beatPrevious) {
  const cardText = formatCards(cards);
  if (!previous) {
    return {
      type: player.id === 0 ? "play" : "ai",
      toast: `${player.name} 首出 ${combo.label}`,
      center: `${player.name} 首出 · ${combo.label} · ${cardText}`,
      duration: 1900,
    };
  }
  if (beatPrevious) {
    const target = state.players[previous.player];
    return {
      type: "beat",
      toast: `${player.name} 压过 ${target.name} 的 ${previous.combo.label}`,
      center: `压制成功 · ${player.name} ${combo.label} · ${cardText}`,
      duration: 2100,
    };
  }
  return {
    type: player.id === 0 ? "play" : "ai",
    toast: `${player.name} 打出 ${combo.label}`,
    center: `${player.name} 打出 · ${combo.label} · ${cardText}`,
    duration: 1900,
  };
}

function nextPlayer(id) {
  return (id + 1) % 3;
}

function getAiDelay() {
  return state.settings.aiSpeed === "fast" ? 260 : 700;
}

function scheduleAiTurn(delay = getAiDelay()) {
  if (state.phase !== "play" || state.turn === 0 || !state.players[state.turn]) return;
  window.clearTimeout(state.aiTimer);
  window.clearTimeout(state.aiCueTimer);
  const player = state.players[state.turn];
  state.aiThinking = state.turn;
  render();
  markSeatFeedback(player.id, "info");
  const cueDelay = Math.min(320, Math.max(90, Math.floor(delay / 2)));
  state.aiCueTimer = window.setTimeout(() => {
    if (state.phase === "play" && state.aiThinking === player.id) {
      showTableCue(`${player.name} · ${player.hero.name} 正在思考`, "thinking", delay + 420);
    }
  }, cueDelay);
  state.aiTimer = window.setTimeout(aiTurn, delay);
}

function clearAiThinking() {
  window.clearTimeout(state.aiTimer);
  window.clearTimeout(state.aiCueTimer);
  state.aiTimer = null;
  state.aiCueTimer = null;
  state.aiThinking = null;
}

function aiTurn() {
  if (state.phase !== "play" || state.turn === 0) return;
  state.aiThinking = null;
  const player = state.players[state.turn];
  maybeAiSkill(player);
  const play = chooseAiPlay(player);
  if (play) completePlay(player.id, play.cards, play.combo);
  else passTurn(player.id);
}

function chooseAiPlay(player) {
  const candidates = generateCandidates(player);
  return candidates.find((candidate) => {
    if (player.buff.frozen && candidate.combo.type !== "single") return false;
    if (state.firstLeadOfRound && state.players[state.landlord].hero.id === "ashe" && (candidate.combo.type === "bomb" || candidate.combo.type === "rocket")) {
      return false;
    }
    return canBeat(candidate.combo, state.current, player);
  });
}

function generateCandidates(player) {
  const hand = [...player.hand].sort((a, b) => a.value - b.value);
  const groups = countGroups(hand).sort((a, b) => a.value - b.value);
  const candidates = [];
  for (const card of hand) addCandidate([card]);
  for (const group of groups) {
    if (group.cards.length >= 2) addCandidate(group.cards.slice(0, 2));
    if (group.cards.length >= 3) addCandidate(group.cards.slice(0, 3));
    if (group.cards.length === 4) addCandidate(group.cards);
  }
  for (const triple of groups.filter((group) => group.cards.length >= 3)) {
    const solo = hand.find((card) => card.value !== triple.value);
    if (solo) addCandidate([...triple.cards.slice(0, 3), solo]);
    const pair = groups.find((group) => group.value !== triple.value && group.cards.length >= 2);
    if (pair) addCandidate([...triple.cards.slice(0, 3), ...pair.cards.slice(0, 2)]);
  }
  addRuns(hand, candidates, player);
  candidates.sort((a, b) => {
    const bombA = a.combo.type === "bomb" || a.combo.type === "rocket";
    const bombB = b.combo.type === "bomb" || b.combo.type === "rocket";
    return Number(bombA) - Number(bombB) || a.combo.value - b.combo.value || a.cards.length - b.cards.length;
  });
  return candidates;

  function addCandidate(cards) {
    const combo = classify(cards, player);
    if (combo) candidates.push({ cards, combo: applyComparisonBuff(combo, player) });
  }
}

function addRuns(hand, candidates, player) {
  const unique = countGroups(hand)
    .filter((group) => group.value < 15)
    .map((group) => group.cards[0])
    .sort((a, b) => a.value - b.value);
  for (let start = 0; start < unique.length; start += 1) {
    for (let len = 4; len <= Math.min(8, unique.length - start); len += 1) {
      const cards = unique.slice(start, start + len);
      const combo = classify(cards, player);
      if (combo) candidates.push({ cards, combo });
    }
  }
}

function maybeAiSkill(player) {
  if (player.usedSkill || player.buff.skillBlocked || Math.random() > 0.36) return;
  useSkill(player.id, true);
}

function useUserSkill() {
  if (state.turn !== 0 || state.players[0].usedSkill) return;
  resetHintCycle();
  useSkill(0, false);
  render();
}

function useSkill(playerId, isAi) {
  const player = state.players[playerId];
  if (player.usedSkill || player.buff.skillBlocked) return;
  player.usedSkill = true;
  playSkillPresentation(player);
  const enemies = state.players.filter((candidate) => candidate.id !== playerId);
  const target = enemies.sort((a, b) => b.hand.length - a.hand.length)[0];
  switch (player.hero.id) {
    case "garen":
      player.buff.garen = true;
      log(`${player.name} 使用审判，下一次单牌或对子 +1。`);
      break;
    case "darius":
      player.buff.dariusExecute = true;
      log(`${player.name} 使用诺克萨斯断头台，下一次压制后弃掉最小手牌。`);
      break;
    case "ashe":
      target.buff.frozen = true;
      markSeatFeedback(target.id, "skill");
      showEvent(`${player.name} 冻结 ${target.name}`, "skill", { center: true, seat: target.id });
      log(`${player.name} 冻结了 ${target.name}。`);
      break;
    case "jinx":
      player.buff.jinxBomb = true;
      log(`${player.name} 点燃火箭，下一组三张 3-10 可当炸弹。`);
      break;
    case "caitlyn":
      markSeatFeedback(target.id, "skill");
      showPeek(player, target, isAi);
      break;
    case "yasuo":
      player.buff.yasuo = true;
      log(`${player.name} 踏前斩蓄势，下一次顺子允许 1 个缺口。`);
      break;
    case "thresh":
      takeFromDiscard(player);
      break;
    case "azir":
      player.buff.azir = true;
      if (player.id === 0 && !isAi) showEvent("沙兵现身：下一次对子可视为三张", "skill", { center: true, seat: player.id });
      log(`${player.name} 召唤沙兵。`);
      break;
    case "pantheon":
      player.buff.pantheonPairBeatsSingle = true;
      log(`${player.name} 星陨冲击，本轮对子可压单牌。`);
      break;
    case "missfortune":
      pirateSwap(player);
      state.players.filter((candidate) => candidate.id !== player.id).forEach((candidate) => markSeatFeedback(candidate.id, "skill"));
      break;
    case "teemo":
      target.buff.mushroomed = true;
      markSeatFeedback(target.id, "skill");
      showEvent(`${player.name} 标记 ${target.name}`, "skill", { center: true, seat: target.id });
      log(`${player.name} 给 ${target.name} 种下蘑菇。`);
      break;
    case "kaisa":
      if (discardLowest(player, "虚空吞噬")) {
        state.multiplier = Math.max(1, state.multiplier - 1);
        showEvent(`${player.name} 虚空吞噬，倍率降低`, "skill", { center: true, seat: player.id });
      }
      break;
    default:
      break;
  }
}

function playSkillPresentation(player) {
  state.voiceHint = `${player.hero.name}：${SKILL_NAMES[player.hero.id] ?? "技能发动"}！`;
  showEvent(`${player.name} 发动 ${SKILL_NAMES[player.hero.id] ?? "技能"}`, "skill", { center: true, seat: player.id, duration: 2100 });
  showSkillBurst(player);
  markSkillCaster(player.id);
  markSkillSpent(player.id);
  playVoiceLine(player.hero.id);
}

function showSkillBurst(player) {
  const burst = el("skillBurst");
  if (!burst) return;
  el("skillBurstCaster").textContent = `${player.name} · ${player.hero.name}`;
  el("skillBurstName").textContent = SKILL_NAMES[player.hero.id] ?? "技能发动";
  el("skillBurstPortrait").setAttribute("style", avatarStyle(player.hero));
  burst.classList.remove("hidden", "play");
  void burst.offsetWidth;
  burst.classList.add("play");
  window.clearTimeout(showSkillBurst.timer);
  showSkillBurst.timer = window.setTimeout(() => {
    burst.classList.add("hidden");
    burst.classList.remove("play");
  }, 1450);
}

function markSkillCaster(playerId) {
  const seat = el(`player${playerId}`);
  const table = document.querySelector(".center-play");
  seat?.classList.remove("skill-cast");
  table?.classList.remove("skill-wave");
  void seat?.offsetWidth;
  seat?.classList.add("skill-cast");
  table?.classList.add("skill-wave");
  window.setTimeout(() => {
    seat?.classList.remove("skill-cast");
    table?.classList.remove("skill-wave");
  }, 1000);
}

function markSkillSpent(playerId) {
  const button = document.querySelector(`[data-skill-owner="${playerId}"]`);
  button?.classList.remove("spent-flash");
  void button?.offsetWidth;
  button?.classList.add("spent-flash");
  window.setTimeout(() => button?.classList.remove("spent-flash"), 900);
}

function playVoiceLine(heroId) {
  if (state.settings.muted || state.settings.volume <= 0) return;
  const candidates = VOICE_LINES[heroId] ?? [];
  if (!candidates.length) return;
  const src = candidates[Math.floor(Math.random() * candidates.length)];
  const audio = new Audio(src);
  audio.volume = state.settings.volume;
  audio.play().catch(() => {});
}

function showPeek(player, target, isAi) {
  const cards = shuffle(target.hand).slice(0, 3);
  if (player.id === 0 && !isAi) showEvent(`侦查：${target.name} 的三张牌 ${formatCards(cards)}`, "skill", { center: true, seat: target.id, duration: 3200 });
  log(`${player.name} 查看了 ${target.name} 的 3 张手牌。${player.id === 0 ? formatCards(cards) : ""}`);
}

function takeFromDiscard(player) {
  const card = [...state.discard].reverse().find((item) => item.value >= 3 && item.value <= 10);
  if (!card) {
    if (player.id === 0) showEvent("魂引之灯：弃牌区没有可拿回的 3-10", "warning", { center: true, seat: player.id });
    log(`${player.name} 使用魂引之灯，但弃牌区没有合适目标。`);
    return;
  }
  state.discard = state.discard.filter((item) => item.id !== card.id);
  player.hand.push(card);
  sortHand(player.hand);
  showEvent(`${player.name} 拿回 ${formatCards([card])}`, "skill", { center: true, seat: player.id });
  log(`${player.name} 从弃牌区拿回 ${formatCards([card])}。`);
}

function pirateSwap(player) {
  for (const target of state.players.filter((candidate) => candidate.id !== player.id)) {
    if (!target.hand.length || !player.hand.length) continue;
    const stolen = target.hand.splice(Math.floor(Math.random() * target.hand.length), 1)[0];
    const returned = player.hand.splice(0, 1)[0];
    player.hand.push(stolen);
    target.hand.push(returned);
    sortHand(player.hand);
    sortHand(target.hand);
  }
  showEvent(`${player.name} 交换两名对手手牌`, "skill", { center: true, seat: player.id });
  log(`${player.name} 发动枪林弹雨，和两名对手交换了随机手牌。`);
}

function discardLowest(player, reason) {
  if (!player.hand.length) return false;
  sortHand(player.hand);
  const [card] = player.hand.splice(0, 1);
  state.discard.push(card);
  markSeatFeedback(player.id, "warning");
  log(`${reason}：${player.name} 弃掉 ${formatCards([card])}。`);
  return true;
}

function discardRandomLow(player, reason) {
  const lows = player.hand.filter((card) => card.value >= 3 && card.value <= 10);
  if (!lows.length) return false;
  const card = shuffle(lows)[0];
  player.hand = player.hand.filter((item) => item.id !== card.id);
  state.discard.push(card);
  markSeatFeedback(player.id, "warning");
  log(`${reason}：${player.name} 随机弃掉 ${formatCards([card])}。`);
  return true;
}

function checkFieldWarnings(player) {
  if (state.players[state.landlord].hero.id !== "thresh") return;
  if (!player.warnedThree && player.hand.length === 3) {
    player.warnedThree = true;
    showPassiveEvent("魂锁典狱", `魂锁典狱警告：${player.name} 只剩 3 张牌。`, player.id);
  }
}

function endGame(winnerId) {
  state.phase = "over";
  state.winner = winnerId;
  const landlordWon = winnerId === state.landlord;
  const winnerSide = landlordWon ? "地主" : "农民";
  const winner = state.players[winnerId];
  const landlord = state.players[state.landlord];
  const remain = state.players
    .map((player) => `${player.name} 剩 ${player.hand.length} 张`)
    .join("；");
  log(`${winner.name} 出完手牌，${landlordWon ? "地主" : "农民"}获胜！最终倍率 x${state.multiplier}。`);
  showEvent(`${winnerSide}胜利：${winner.name} 出完手牌`, "win", { center: true, seat: winnerId, duration: 3200 });
  showModal("游戏结束", "");
  el("modalTitle").textContent = `${winnerSide}胜利`;
  el("modalBody").innerHTML = renderResultSummary(winner, landlord, winnerSide);
  el("modalCloseBtn")?.classList.add("hidden");
  el("modalChoices").innerHTML = `<button type="button" class="primary" id="restartBtn">再来一局</button>`;
  el("restartBtn").addEventListener("click", () => window.location.reload());
  render();
}

function renderResultSummary(winner, landlord, winnerSide) {
  const playerRows = state.players
    .map(
      (player) => `
        <li class="${player.id === winner.id ? "winner" : ""} ${player.id === state.landlord ? "landlord" : ""}">
          <span>${player.name} · ${player.hero.name}</span>
          <b>${player.role}</b>
          <em>${player.hand.length} 张</em>
        </li>
      `,
    )
    .join("");
  return `
    <section class="result-panel">
      <div class="result-hero">
        <div class="hero-portrait result-portrait" style="${avatarStyle(winner.hero)}"></div>
        <div>
          <span>获胜阵营</span>
          <strong>${winnerSide}</strong>
          <p>${winner.name} · ${winner.hero.name} 出完手牌</p>
        </div>
      </div>
      <div class="result-stats">
        <div><span>最终倍率</span><strong>x${state.multiplier}</strong></div>
        <div><span>地主城邦</span><strong>${landlord.hero.city}</strong></div>
        <div><span>地主英雄</span><strong>${landlord.hero.name}</strong></div>
      </div>
      <ul class="result-players">${playerRows}</ul>
    </section>
  `;
}

function addHistory(playerId, label, cards, meta = {}) {
  state.history.unshift({
    id: `${Date.now()}-${Math.random()}`,
    playerId,
    player: state.players[playerId].name,
    hero: state.players[playerId].hero.name,
    label,
    cards: [...cards],
    kind: meta.kind || (cards.length ? "play" : "pass"),
    targetId: meta.targetId ?? null,
  });
  state.history = state.history.slice(0, 8);
}

function formatCards(cards) {
  return cards.map((card) => `${card.rank}${card.suit}`).join(" ");
}

function render() {
  el("phaseLabel").textContent =
    state.phase === "bid"
      ? "抢地主阶段"
      : state.phase === "play"
        ? state.turn === 0
          ? "你的回合"
          : "出牌中"
        : state.phase === "over"
          ? "已结束"
          : "英雄选择";
  renderSeats();
  renderCenter();
  renderActions();
  renderCity();
  renderSelected();
  renderOpponentSummary();
  renderTableState();
  renderComboHint();
  renderSelectionPreview();
  renderSkillReadiness();
  renderGuideLock();
}

function openGuide() {
  if (el("modal")?.open) return;
  closeCatalog();
  closeSettings();
  state.guideStep = 0;
  renderGuideStep();
  el("guideOverlay")?.classList.remove("hidden");
}

function closeGuide() {
  el("guideOverlay")?.classList.add("hidden");
}

function openCatalog(heroId = state.catalogHeroId) {
  if (el("modal")?.open) return;
  closeGuide();
  closeSettings();
  state.catalogHeroId = heroId;
  renderCatalog();
  el("catalogOverlay")?.classList.remove("hidden");
}

function closeCatalog() {
  el("catalogOverlay")?.classList.add("hidden");
}

function openSettings() {
  if (el("modal")?.open) return;
  closeGuide();
  closeCatalog();
  renderSettings();
  el("settingsOverlay")?.classList.remove("hidden");
}

function closeSettings() {
  el("settingsOverlay")?.classList.add("hidden");
}

function renderCatalog() {
  const list = el("catalogList");
  const detail = el("catalogDetail");
  if (!list || !detail) return;
  const selected = HEROES.find((hero) => hero.id === state.catalogHeroId) ?? HEROES[0];
  state.catalogHeroId = selected.id;
  list.innerHTML = HEROES.map(
    (hero) => `
      <button type="button" class="catalog-card ${hero.id === selected.id ? "active" : ""}" data-catalog-hero="${hero.id}">
        <div class="hero-portrait tiny" style="${avatarStyle(hero)}"></div>
        <span>${hero.name}</span>
        <small>${hero.city}</small>
      </button>
    `,
  ).join("");
  detail.innerHTML = `
    <div class="catalog-portrait hero-portrait" style="${avatarStyle(selected)}"></div>
    <div class="catalog-detail-copy">
      <p class="eyebrow">${selected.city}</p>
      <h3>${selected.name}</h3>
      <div class="catalog-rule">
        <span>主动技能</span>
        <strong>${SKILL_NAMES[selected.id] ?? "主动技能"}</strong>
        <p>${selected.skill}</p>
      </div>
      <div class="catalog-rule passive">
        <span>地主城邦被动</span>
        <strong>${selected.city}</strong>
        <p>${selected.field}</p>
      </div>
    </div>
  `;
  document.querySelectorAll("[data-catalog-hero]").forEach((button) => {
    button.addEventListener("click", () => {
      state.catalogHeroId = button.dataset.catalogHero;
      renderCatalog();
    });
  });
}

function renderGuideStep() {
  const step = GUIDE_STEPS[state.guideStep];
  if (!step) return;
  el("guideTitle").textContent = step.title;
  el("guideBody").textContent = step.body;
  el("guidePrevBtn").disabled = state.guideStep === 0;
  el("guideNextBtn").textContent = state.guideStep === GUIDE_STEPS.length - 1 ? "完成" : "下一步";
  el("guideDots").innerHTML = GUIDE_STEPS.map((_, index) => `<i class="${index === state.guideStep ? "active" : ""}"></i>`).join("");
}

function moveGuide(delta) {
  const next = state.guideStep + delta;
  if (next >= GUIDE_STEPS.length) {
    closeGuide();
    return;
  }
  state.guideStep = Math.max(0, next);
  renderGuideStep();
}

function renderGuideLock() {
  const locked = Boolean(el("modal")?.open);
  el("guideBtn").disabled = locked;
  el("catalogBtn").disabled = locked;
  el("settingsBtn").disabled = locked;
}

function renderSettings() {
  el("muteLabel").textContent = state.settings.muted ? "关闭" : "开启";
  el("muteBtn").textContent = state.settings.muted ? "开启语音" : "静音";
  el("volumeSlider").value = String(Math.round(state.settings.volume * 100));
  el("volumeLabel").textContent = `${Math.round(state.settings.volume * 100)}%`;
  el("speedLabel").textContent = state.settings.aiSpeed === "fast" ? "快速" : "正常";
  el("speedNormalBtn").classList.toggle("active", state.settings.aiSpeed === "normal");
  el("speedFastBtn").classList.toggle("active", state.settings.aiSpeed === "fast");
  el("speedNormalBtn").setAttribute("aria-pressed", String(state.settings.aiSpeed === "normal"));
  el("speedFastBtn").setAttribute("aria-pressed", String(state.settings.aiSpeed === "fast"));
  el("newRoundBtn").disabled = !state.players.length;
}

function toggleMute() {
  state.settings.muted = !state.settings.muted;
  renderSettings();
  showEvent(state.settings.muted ? "技能语音已静音" : "技能语音已开启", "info");
}

function setVolume(value) {
  state.settings.volume = Math.max(0, Math.min(1, Number(value) / 100));
  if (state.settings.volume > 0) state.settings.muted = false;
  renderSettings();
}

function setAiSpeed(speed) {
  state.settings.aiSpeed = speed === "fast" ? "fast" : "normal";
  renderSettings();
  showEvent(`AI 速度已切换为${state.settings.aiSpeed === "fast" ? "快速" : "正常"}`, "info");
}

function restartCurrentMatch() {
  const hero = state.players[0]?.hero;
  closeSettings();
  if (hero) startGame(hero.id);
  else {
    setupHeroSelect();
    render();
  }
  showEvent("已重新开局", "info");
}

function backToHeroSelect() {
  closeSettings();
  closeGuide();
  closeCatalog();
  state.phase = "hero";
  state.players = [];
  state.bottom = [];
  state.selected.clear();
  state.turn = 0;
  state.landlord = null;
  state.current = null;
  state.history = [];
  state.passes = 0;
  state.multiplier = 1;
  state.log = [];
  state.discard = [];
  state.firstLeadOfRound = true;
  state.forcedNoPass = false;
  state.fieldFlags = {};
  state.winner = null;
  state.voiceHint = "";
  clearAiThinking();
  resetHintCycle();
  el("gameBoard").classList.add("hidden");
  el("heroSelect").classList.remove("hidden");
  el("bidActions").classList.add("hidden");
  el("playActions").classList.add("hidden");
  setupHeroSelect();
  render();
  renderLog();
  showEvent("已返回英雄选择", "info");
}

function renderSeats() {
  state.players.forEach((player) => {
    const seat = el(`player${player.id}`);
    const isSelf = player.id === 0;
    const active = state.turn === player.id && state.phase === "play";
    const thinking = state.aiThinking === player.id;
    seat.classList.toggle("active", active);
    seat.classList.toggle("thinking", thinking);
    seat.classList.toggle("low-hand", player.hand.length <= 5 && state.phase === "play");
    seat.innerHTML = `
      <div class="seat-head">
        <div class="seat-profile">
          <div class="hero-portrait" style="${avatarStyle(player.hero)}"></div>
          <div>
            <strong>${active ? "▶ " : ""}${player.name} · ${player.hero.name}</strong>
            <div class="meta">${player.hero.city} · ${thinking ? "思考中" : player.usedSkill ? "技能已用" : "技能可用"}</div>
          </div>
        </div>
        <span class="tag role-tag ${player.role === "农民" ? "role-farmer" : player.role === "地主" ? "role-landlord" : ""}">${player.role}</span>
      </div>
      <div class="hand-count ${isSelf ? "self-count" : ""}">
        <span>剩余手牌</span>
        <strong>${player.hand.length}</strong>
        <em>张</em>
      </div>
      ${renderSeatLastAction(player)}
      ${renderSkillButton(player, isSelf)}
      ${isSelf ? `<div class="voice-line"><span>音</span><strong>${state.voiceHint || `${player.hero.name}：技能语音待命`}</strong></div>` : ""}
      ${isSelf ? `<div class="hand">${player.hand.map(renderCard).join("")}</div>` : ""}
    `;
  });
  document.querySelectorAll(".card.selectable").forEach((node) => {
    node.addEventListener("click", () => {
      const id = Number(node.dataset.id);
      resetHintCycle();
      if (state.selected.has(id)) state.selected.delete(id);
      else state.selected.add(id);
      render();
    });
  });
  document.querySelectorAll(".hero-skill-button").forEach((node) => {
    node.addEventListener("click", (event) => {
      event.stopPropagation();
      const wrap = node.closest(".skill-button-wrap");
      document.querySelectorAll(".skill-button-wrap.open").forEach((item) => {
        if (item !== wrap) item.classList.remove("open");
      });
      const isOpen = wrap?.classList.toggle("open");
      node.setAttribute("aria-expanded", String(Boolean(isOpen)));
    });
  });
}

function renderSeatLastAction(player) {
  const latest = state.history.find((item) => item.playerId === player.id);
  if (!latest) {
    return `<div class="seat-last-action empty"><span>上一手</span><strong>暂无动作</strong></div>`;
  }
  const isPass = latest.cards.length === 0;
  return `
    <div class="seat-last-action ${isPass ? "pass" : "play"}">
      <span>上一手</span>
      <strong>${latest.label}</strong>
      <div class="seat-last-mini">${isPass ? "<em>PASS</em>" : latest.cards.slice(0, 5).map(renderMiniCard).join("")}</div>
    </div>
  `;
}

function renderSkillButton(player, isSelf = false) {
  const stateLabel = player.buff.skillBlocked
    ? "disabled"
    : player.usedSkill
      ? "used"
      : "ready";
  const statusText = skillStatusText(player);
  return `
    <div class="skill-button-wrap ${isSelf ? "self-skill" : "compact-skill"}">
      <button
        type="button"
        class="hero-skill-button ${stateLabel}"
        data-skill-owner="${player.id}"
        aria-label="${player.hero.name}技能：${SKILL_NAMES[player.hero.id] ?? "主动技能"}"
        aria-expanded="false"
      >
        <i>✦</i>
        <span>${SKILL_NAMES[player.hero.id] ?? "主动技能"}</span>
        <em>${statusText}</em>
      </button>
      <div class="skill-tooltip">
        <strong>${player.hero.name} · ${SKILL_NAMES[player.hero.id] ?? "主动技能"}</strong>
        <span>类型：主动</span>
        <p>${player.hero.skill}</p>
        <small>状态：${statusText}</small>
      </div>
    </div>
  `;
}

function skillStatusText(player) {
  if (player.buff.skillBlocked) return "禁用";
  if (player.usedSkill) return "已使用";
  return "可用";
}

function avatarStyle(hero) {
  const index = HEROES.findIndex((item) => item.id === hero.id);
  const col = index % 4;
  const row = Math.floor(index / 4);
  const x = col === 0 ? 0 : col === 3 ? 100 : col * 33.333;
  const y = row === 0 ? 0 : row === 2 ? 100 : 50;
  return `--avatar-x:${x}%;--avatar-y:${y}%;`;
}

function renderCard(card) {
  const selected = state.selected.has(card.id);
  return renderPlayingCard(card, `selectable ${selected ? "selected" : ""}`, `data-id="${card.id}"`);
}

function renderBacks(count) {
  return Array.from({ length: count }, () => `<div class="card back"><span class="card-back-mark">◆</span></div>`).join("");
}

function renderCenter() {
  if (state.phase === "bid") {
    el("lastPlay").textContent = "点击抢地主将直接成为地主";
    el("playPile").innerHTML = `<div class="center-prompt"><strong>是否抢地主？</strong><span>点击抢地主将直接成为地主</span></div>`;
    renderHistory();
    return;
  }
  if (!state.current) {
    el("lastPlay").textContent = "新一轮，等待首出";
    el("playPile").innerHTML = "";
    renderHistory();
    return;
  }
  el("lastPlay").textContent = `${state.players[state.current.player].name} 的 ${state.current.combo.label}`;
  el("playPile").innerHTML = state.current.cards.map((card) => renderPlayingCard(card)).join("");
  renderHistory();
}

function renderHistory() {
  const historyEl = el("playHistory");
  if (!historyEl) return;
  if (!state.history.length) {
    historyEl.innerHTML = `<div class="history-empty">本局战报将在这里显示</div>`;
    return;
  }
  historyEl.innerHTML = state.history
    .map(
      (item, index) => `
      <div class="history-item ${item.kind || (item.cards.length ? "play" : "pass")} ${index === 0 ? "latest" : ""}">
        <div class="history-meta">
          <i>${historyKindText(item)}</i>
          <span>${item.player} · ${item.hero}</span>
        </div>
        <strong>${historyTitle(item)}</strong>
        <div class="mini-cards">${renderHistoryCards(item)}</div>
      </div>
    `,
    )
    .join("");
}

function historyKindText(item) {
  return {
    beat: "压制",
    play: "出牌",
    pass: "过牌",
    round: "新轮",
  }[item.kind] || "记录";
}

function historyTitle(item) {
  if (item.kind === "beat" && item.targetId !== null) {
    return `${item.label} · 压过 ${state.players[item.targetId]?.name ?? "对手"}`;
  }
  return item.label;
}

function renderHistoryCards(item) {
  if (item.kind === "round") return "<em>LEAD</em>";
  if (!item.cards.length) return "<em>PASS</em>";
  const visibleCards = item.cards.slice(0, 5).map(renderMiniCard).join("");
  const more = item.cards.length > 5 ? `<em>+${item.cards.length - 5}</em>` : "";
  return visibleCards + more;
}

function renderMiniCard(card) {
  return `<i class="mini-card ${card.red ? "red" : ""}"><span>${card.rank}</span><b>${card.suit}</b></i>`;
}

function renderPlayingCard(card, extraClass = "", attrs = "") {
  const rank = card.joker ? (card.value === 17 ? "JOKER" : "Joker") : card.rank;
  const suit = card.joker ? "★" : card.suit;
  const face = card.joker ? (card.value === 17 ? "大王" : "小王") : suit;
  return `
    <div class="card ${card.red ? "red" : ""} ${card.joker ? "joker" : ""} ${extraClass}" ${attrs}>
      <span class="card-corner top"><b>${rank}</b><i>${suit}</i></span>
      <span class="card-face">${face}</span>
      <span class="card-corner bottom"><b>${rank}</b><i>${suit}</i></span>
    </div>
  `;
}

function setActionButton(button, label, key, note) {
  if (!button) return;
  const keyText = key ? `<b>${key}</b>` : "";
  const noteText = note ? `<em>${note}</em>` : "";
  button.innerHTML = `<span class="action-label">${label}</span><small>${keyText}${noteText}</small>`;
  button.setAttribute("data-key", key || "");
  button.setAttribute("data-note", note || "");
}

function renderActions() {
  const yourTurn = state.turn === 0 && state.phase === "play";
  const selectionResult = yourTurn ? getUserSelectionResult() : { legal: false, reason: "" };
  const recommendation = yourTurn ? recommendedAction(selectionResult) : "none";
  const turnHint = el("turnHint");
  el("bidActions").classList.toggle("hidden", state.phase !== "bid");
  el("playActions").classList.toggle("hidden", state.phase !== "play");
  el("bidActions").setAttribute("aria-hidden", String(state.phase !== "bid"));
  el("playActions").setAttribute("aria-hidden", String(state.phase !== "play"));
  turnHint.classList.remove("good", "bad", "waiting");
  turnHint.textContent =
    state.phase === "bid"
      ? "抢地主阶段：点击抢地主将直接成为地主"
      : state.phase === "play"
        ? yourTurn
          ? actionHintText(selectionResult)
          : `${state.players[state.turn].name} 正在思考`
        : "本局结束";
  if (state.phase === "play" && yourTurn) {
    turnHint.classList.add(selectionResult.legal ? "good" : state.selected.size ? "bad" : "waiting");
  } else if (state.phase === "play") {
    turnHint.classList.add("waiting");
  }
  setActionButton(el("skipBidBtn"), "不抢", "", "交给下家");
  setActionButton(el("callBidBtn"), "抢地主", "", "直接成为地主");
  el("playBtn").disabled = !yourTurn || !selectionResult.legal;
  el("playBtn").classList.toggle("ready", yourTurn && selectionResult.legal);
  el("playBtn").classList.toggle("recommended", recommendation === "play");
  el("playBtn").title = selectionResult.legal ? "打出当前选牌（Enter）" : selectionResult.reason || "等待你的回合";
  el("passBtn").disabled = !yourTurn || !state.current;
  el("passBtn").classList.toggle("recommended", recommendation === "pass");
  el("passBtn").title = yourTurn && state.current ? (recommendation === "pass" ? "推荐不要：当前没有可压过的牌（Space）" : "不要（Space）") : "当前不能过牌";
  el("hintBtn").disabled = !yourTurn;
  el("hintBtn").classList.toggle("recommended", recommendation === "hint");
  el("hintBtn").title = yourTurn ? (recommendation === "hint" ? "推荐提示：查看可出牌（H）" : "提示可出牌（H）") : "等待你的回合";
  el("skillBtn").disabled = !yourTurn || state.players[0].usedSkill || state.players[0].buff.skillBlocked;
  el("skillBtn").classList.toggle("recommended", recommendation === "skill");
  el("skillBtn").title = !yourTurn
    ? "等待你的回合"
    : state.players[0].usedSkill
      ? "技能已使用"
      : state.players[0].buff.skillBlocked
        ? "技能暂时禁用"
        : "使用英雄技能（S）";
  const skillNote = !state.players.length
    ? "未入局"
    : state.players[0].usedSkill
      ? "已使用"
      : state.players[0].buff.skillBlocked
        ? "禁用"
        : recommendation === "skill"
          ? "推荐"
          : "主动技能";
  const hintNote = recommendation === "hint" ? "推荐" : "找可出牌";
  const passNote = !state.current ? "首出不可过" : recommendation === "pass" ? "推荐不要" : "过牌";
  const playNote = selectionResult.legal ? "可以打出" : state.selected.size ? "不可出" : "待选牌";
  setActionButton(el("skillBtn"), "技能", "S", skillNote);
  setActionButton(el("hintBtn"), "提示", "H", hintNote);
  setActionButton(el("passBtn"), "不要", "Space", passNote);
  setActionButton(el("playBtn"), "出牌", "Enter", playNote);
}

function recommendedAction(selectionResult) {
  if (state.phase !== "play" || state.turn !== 0) return "none";
  if (selectionResult.legal) return "play";
  if (state.selected.size) return "hint";
  const player = state.players[0];
  const candidates = chooseSuggestedPlays(player);
  if (candidates.length) return "hint";
  if (state.current) return "pass";
  if (!player.usedSkill && !player.buff.skillBlocked) return "skill";
  return "hint";
}

function actionHintText(selectionResult) {
  if (!state.selected.size) {
    return state.current ? `轮到你行动：目标压过 ${state.current.combo.label}` : "轮到你行动：请选择首出牌";
  }
  if (selectionResult.legal) {
    return `可以出：${selectionResult.combo.label} · ${formatCards(selectionResult.cards)}`;
  }
  return selectionResult.reason;
}

function renderOpponentSummary() {
  const summary = el("opponentSummary");
  if (!summary || !state.players.length) return;
  summary.innerHTML = state.players
    .filter((player) => player.id !== 0)
    .map(
      (player) => `
      <div class="opponent-chip">
        <div class="hero-portrait tiny" style="${avatarStyle(player.hero)}"></div>
        <span>${player.name} · ${player.hero.name}</span>
        <strong>${player.hand.length}</strong>
      </div>
    `,
    )
    .join("");
}

function renderTableState() {
  const tableState = el("tableState");
  const roundInfo = el("roundInfo");
  const decisionCoach = el("decisionCoach");
  const roundProgress = el("roundProgress");
  if (!tableState || !roundInfo) return;
  if (!state.players.length) {
    tableState.innerHTML = "";
    roundInfo.textContent = "";
    if (decisionCoach) decisionCoach.innerHTML = "";
    if (roundProgress) roundProgress.innerHTML = "";
    return;
  }
  const landlord = state.landlord === null ? null : state.players[state.landlord];
  const active = state.phase === "play" ? state.players[state.turn] : null;
  const current = state.current ? state.players[state.current.player] : null;
  const pressure = state.current
    ? `${state.current.combo.label} · ${formatCards(state.current.cards)}`
    : state.phase === "play"
      ? "新一轮，首家可自由出牌"
      : "等待抢地主";
  tableState.innerHTML = `
    <div class="state-chip">
      <span>当前行动</span>
      <strong>${active ? `${active.name} · ${active.hero.name}${state.aiThinking === active.id ? " · 思考中" : ""}` : state.phase === "bid" ? "抢地主阶段" : "英雄选择"}</strong>
    </div>
    <div class="state-chip">
      <span>地主与城邦</span>
      <strong>${landlord ? `${landlord.name} · ${landlord.hero.city}` : "尚未确定"}</strong>
    </div>
    <div class="state-chip">
      <span>剩余手牌</span>
      <strong class="remaining-hud">${renderRemainingHud()}</strong>
    </div>
  `;
  roundInfo.innerHTML = current
    ? `当前需要压过 <b>${current.name}</b> 的 <b>${pressure}</b>，已过牌 <b>${state.passes}</b>/2`
    : state.phase === "bid"
      ? "是否抢地主？抢地主后直接成为地主"
      : pressure;
  renderRoundProgress(roundProgress, current);
  renderDecisionCoach(decisionCoach, active, current);
}

function renderRemainingHud() {
  return state.players
    .map((player) => {
      const count = player.hand.length;
      const level = count <= 3 ? "danger" : count <= 5 ? "low" : "normal";
      const label = player.id === 0 ? "你" : player.name.replace(" ", "");
      const warning = count <= 3 ? "<em>危险</em>" : "";
      return `<span class="remaining-chip ${level}"><b>${label}</b><i>${count}</i>${warning}</span>`;
    })
    .join("");
}

function renderRoundProgress(container, currentPlayer) {
  if (!container) return;
  if (!state.players.length || state.phase !== "play") {
    container.className = "round-progress hidden";
    container.innerHTML = "";
    return;
  }
  const hasPressure = Boolean(state.current && currentPlayer);
  const leader = hasPressure ? currentPlayer : state.players[state.turn];
  const passText = hasPressure ? `${state.passes}/2` : "首出";
  container.className = `round-progress ${hasPressure ? "pressure" : "lead"} passes-${Math.min(state.passes, 2)}`;
  container.innerHTML = `
    <span>本轮</span>
    <strong>${hasPressure ? `${leader.name} 保持压制` : `${leader.name} 首出`}</strong>
    <div class="pass-track" aria-label="过牌进度 ${passText}">
      <i class="${state.passes >= 1 ? "filled" : ""}"></i>
      <i class="${state.passes >= 2 ? "filled" : ""}"></i>
      <em>${passText}</em>
    </div>
  `;
}

function renderDecisionCoach(container, active, currentPlayer) {
  if (!container) return;
  if (!state.players.length) {
    container.innerHTML = "";
    return;
  }
  const currentPlay = state.current;
  const yourTurn = state.phase === "play" && state.turn === 0;
  const selectedCount = state.selected.size;
  const selectionResult = yourTurn ? getUserSelectionResult() : null;
  const chips = [];
  let tone = "waiting";
  let title = "准备";
  let body = "等待牌局开始";
  if (state.phase === "bid") {
    tone = "bid";
    title = "是否抢地主？";
    body = "点击抢地主会直接成为地主并激活你的城邦被动；不抢则让下一名玩家决定。";
    chips.push(["主操作", "抢地主"], ["次操作", "不抢"]);
  } else if (state.phase === "play" && yourTurn) {
    tone = selectionResult?.legal ? "ready" : selectedCount ? "blocked" : "active";
    const recommendation = recommendedAction(selectionResult);
    const recommendationText = {
      play: "出牌",
      pass: "不要",
      hint: "点提示",
      skill: "可用技能",
      none: currentPlay ? "压制 / 不要" : "首出",
    }[recommendation];
    title = currentPlay && currentPlayer ? `目标：压过 ${currentPlayer.name} 的 ${currentPlay.combo.label}` : "你获得首出权";
    body = selectionResult?.legal
      ? `已选 ${selectedCount} 张，可以打出 ${selectionResult.combo.label}。`
      : selectedCount
        ? selectionResult.reason
        : currentPlay
          ? "选择能压过当前牌型的牌；没有合适牌时可以不要。"
          : "首出可以选择任意合法牌型，建议先用提示找低风险出法。";
    chips.push(
      ["当前", selectedCount ? `${selectedCount} 张已选` : "未选牌"],
      ["建议", recommendationText],
      ["快捷", "H 提示"],
    );
  } else if (state.phase === "play" && active) {
    tone = state.aiThinking === active.id ? "thinking" : "waiting";
    title = `等待 ${active.name} 行动`;
    body = currentPlay && currentPlayer
      ? `${active.name} 需要压过 ${currentPlayer.name} 的 ${currentPlay.combo.label}。`
      : `${active.name} 本轮重新首出，可以自由出牌。`;
    chips.push(["行动方", `${active.name} · ${active.hero.name}`], ["已过牌", `${state.passes}/2`]);
  } else if (state.phase === "over") {
    tone = "over";
    title = "本局结束";
    body = "查看结算后可以再来一局。";
    chips.push(["结果", state.winner === state.landlord ? "地主胜利" : "农民胜利"]);
  }
  container.className = `decision-coach ${tone}`;
  container.innerHTML = `
    <div>
      <span>行动目标</span>
      <strong>${title}</strong>
      <p>${body}</p>
    </div>
    <div class="coach-chips">
      ${chips.map(([label, value]) => `<i><b>${label}</b><em>${value}</em></i>`).join("")}
    </div>
  `;
}

function renderComboHint() {
  const hint = el("comboHint");
  if (!hint) return;
  hint.classList.remove("good", "bad");
  if (!state.players.length || state.phase !== "play") {
    hint.textContent = "选牌后显示牌型";
    return;
  }
  const cards = selectedCards();
  if (!cards.length) {
    hint.textContent = state.current
      ? `目标：压过 ${state.current.combo.label}`
      : "本轮首出：请选择任意合法牌型";
    return;
  }
  const result = getUserSelectionResult();
  if (!result.combo) {
    hint.textContent = `${cards.length} 张：${result.reason}`;
    hint.classList.add("bad");
    return;
  }
  hint.textContent = `${result.combo.label} · ${formatCards(cards)} · ${result.legal ? "可以出" : result.reason}`;
  hint.classList.add(result.legal ? "good" : "bad");
}

function renderSelectionPreview() {
  const preview = el("selectedPreview");
  if (!preview) return;
  preview.classList.remove("good", "bad", "empty");
  if (!state.players.length || state.phase !== "play") {
    preview.classList.add("empty");
    preview.innerHTML = `<span>选牌预览</span><strong>进入出牌阶段后显示</strong>`;
    return;
  }
  const cards = selectedCards();
  if (!cards.length) {
    preview.classList.add("empty");
    preview.innerHTML = `
      <span>选牌预览</span>
      <strong>${state.current ? `目标：压过 ${state.current.combo.label}` : "首出：请选择手牌"}</strong>
      <div class="preview-mini"><em>未选牌</em></div>
    `;
    return;
  }
  const result = getUserSelectionResult();
  const status = result.legal ? "可以出" : "不可出";
  preview.classList.add(result.legal ? "good" : "bad");
  preview.innerHTML = `
    <span>${status}</span>
    <strong>${result.combo?.label ?? result.reason}</strong>
    <div class="preview-mini">${cards.map(renderMiniCard).join("")}</div>
  `;
}

function renderSkillReadiness() {
  const panel = el("skillReadiness");
  if (!panel) return;
  panel.classList.remove("ready", "used", "disabled", "hidden");
  if (!state.players.length || state.phase !== "play") {
    panel.classList.add("hidden");
    panel.innerHTML = "";
    return;
  }
  const player = state.players[0];
  const status = player.buff.skillBlocked ? "disabled" : player.usedSkill ? "used" : "ready";
  const statusText = skillStatusText(player);
  panel.classList.add(status);
  panel.innerHTML = `
    <span>英雄技能</span>
    <strong>${SKILL_NAMES[player.hero.id] ?? "主动技能"}</strong>
    <em>${statusText}${status === "ready" && state.turn === 0 ? " · S 发动" : ""}</em>
  `;
}

function renderCity() {
  document.querySelector(".city-panel")?.classList.toggle("active-passive", state.landlord !== null);
  if (state.landlord === null) {
    el("cityName").textContent = "等待抢地主";
    el("cityEffect").textContent = "抢到地主后激活绑定城邦效果。";
    el("bottomCards").innerHTML = renderBacks(state.bottom.length);
    return;
  }
  const hero = state.players[state.landlord].hero;
  el("cityName").textContent = `${hero.city} · ${hero.name}`;
  el("cityEffect").textContent = hero.field;
  el("bottomCards").innerHTML = state.bottom.map((card) => renderPlayingCard(card)).join("");
}

function renderSelected() {
  const clearBtn = el("clearSelectionBtn");
  const hasSelection = state.selected.size > 0;
  el("selectedLabel").textContent = hasSelection ? `${state.selected.size} 张 · 重选` : "0 张";
  clearBtn.disabled = !hasSelection;
  clearBtn.classList.toggle("has-selection", hasSelection);
  clearBtn.title = hasSelection ? "清空当前选牌（Esc）" : "当前没有选中的牌";
}

function renderLog() {
  el("log").innerHTML = state.log.map((item) => `<div>${item}</div>`).join("");
}

function showModal(title, body) {
  el("modalTitle").textContent = title;
  el("modalBody").textContent = body;
  el("modalChoices").innerHTML = "";
  el("modalCloseBtn")?.classList.remove("hidden");
  el("modal").showModal();
}

function visible(node) {
  if (!node) return false;
  if (node.closest?.(".hidden")) return false;
  const style = window.getComputedStyle(node);
  return style.display !== "none" && style.visibility !== "hidden" && node.getClientRects().length > 0;
}

function runUiAudit() {
  const requiredIds = [
    "heroSelect",
    "gameBoard",
    "phaseLabel",
    "guideBtn",
    "catalogBtn",
    "settingsBtn",
    "eventToast",
    "modal",
    "landlordReveal",
    "roundProgress",
    "decisionCoach",
    "selectedPreview",
    "skillReadiness",
    "player0",
    "player1",
    "player2",
    "cityName",
    "playPile",
    "bidActions",
    "playActions",
  ];
  const missingIds = requiredIds.filter((id) => !el(id));
  const visibleSkillSlots = [...document.querySelectorAll(".skill-slot, .skill-slots")].filter(visible).length;
  const skillButtons = [...document.querySelectorAll(".hero-skill-button")].filter(visible);
  const decisionCoach = el("decisionCoach");
  const roundProgress = el("roundProgress");
  const selectedPreview = el("selectedPreview");
  const skillReadiness = el("skillReadiness");
  const playHistory = el("playHistory");
  const lastActionNodes = [...document.querySelectorAll(".seat-last-action")].filter(visible);
  const recommendedButtons = [...document.querySelectorAll("#playActions button.recommended")].filter(visible);
  const visibleActionButtons = [...document.querySelectorAll("#bidActions button, #playActions button")].filter(visible);
  const actionButtonsDetailed =
    state.phase === "hero" ||
    state.phase === "over" ||
    (visibleActionButtons.length > 0 && visibleActionButtons.every((button) => button.querySelector(".action-label") && button.querySelector("small")));
  const resultPanel = document.querySelector(".result-panel");
  const overlayCount = ["guideOverlay", "catalogOverlay", "settingsOverlay"].filter((id) => visible(el(id))).length;
  const bodyText = document.body.innerText || "";
  const fakeCountdownPattern = /回合倒计时|\b(?:20s|8s)\b/i;
  const noScroll =
    document.documentElement.scrollHeight <= window.innerHeight + 2 &&
    document.documentElement.scrollWidth <= window.innerWidth + 2;
  const phaseButtonsOk =
    (state.phase === "bid" && visible(el("bidActions")) && !visible(el("playActions"))) ||
    (state.phase === "play" && visible(el("playActions")) && !visible(el("bidActions"))) ||
    (state.phase === "hero" && !visible(el("bidActions")) && !visible(el("playActions"))) ||
    state.phase === "over";
  const singleSkillOk = !state.players.length || skillButtons.length === state.players.length;
  const results = {
    missingIds,
    noScroll,
    phase: state.phase,
    phaseButtonsOk,
    singleSkillOk,
    visibleSkillButtons: skillButtons.length,
    visibleSkillSlots,
    decisionCoachVisible: !state.players.length || visible(decisionCoach),
    decisionCoachText: decisionCoach?.innerText?.slice(0, 80) ?? "",
    roundProgressVisible: state.phase !== "play" || visible(roundProgress),
    roundProgressText: roundProgress?.innerText?.slice(0, 80) ?? "",
    selectedPreviewVisible: state.phase !== "play" || visible(selectedPreview),
    selectedPreviewText: selectedPreview?.innerText?.slice(0, 80) ?? "",
    skillReadinessVisible: state.phase !== "play" || visible(skillReadiness),
    skillReadinessText: skillReadiness?.innerText?.slice(0, 80) ?? "",
    playHistoryVisible: state.phase !== "play" || visible(playHistory),
    playHistoryStructured: state.history.length === 0 || Boolean(playHistory?.querySelector(".history-meta")),
    seatLastActionsVisible: !state.players.length || lastActionNodes.length === state.players.length,
    recommendedActionVisible: !(state.phase === "play" && state.turn === 0) || recommendedButtons.length >= 1,
    actionButtonsDetailed,
    resultPanelOk:
      state.phase !== "over" ||
      Boolean(resultPanel?.querySelector(".result-hero") && resultPanel.querySelectorAll(".result-players li").length === 3 && el("restartBtn")),
    overlayCount,
    overlaysMutuallyExclusive: overlayCount <= 1,
    noFakeCountdownText: !fakeCountdownPattern.test(bodyText),
    modalAvailable: Boolean(el("modal")?.showModal),
    viewport: `${window.innerWidth}x${window.innerHeight}`,
  };
  const passed =
    missingIds.length === 0 &&
    noScroll &&
    phaseButtonsOk &&
    singleSkillOk &&
    visibleSkillSlots === 0 &&
    (!state.players.length || visible(decisionCoach)) &&
    (state.phase !== "play" || visible(roundProgress)) &&
    (!state.players.length || lastActionNodes.length === state.players.length) &&
    (!(state.phase === "play" && state.turn === 0) || recommendedButtons.length >= 1) &&
    actionButtonsDetailed &&
    (state.phase !== "play" || visible(selectedPreview)) &&
    (state.phase !== "play" || visible(skillReadiness)) &&
    (state.phase !== "play" || visible(playHistory)) &&
    (state.history.length === 0 || Boolean(playHistory?.querySelector(".history-meta"))) &&
    (state.phase !== "over" ||
      Boolean(resultPanel?.querySelector(".result-hero") && resultPanel.querySelectorAll(".result-players li").length === 3 && el("restartBtn"))) &&
    overlayCount <= 1 &&
    results.noFakeCountdownText &&
    results.modalAvailable;
  const report = { passed, ...results };
  console.table(report);
  return report;
}

window.runUiAudit = runUiAudit;

el("callBidBtn").addEventListener("click", () => userBid(true));
el("skipBidBtn").addEventListener("click", () => userBid(false));
el("playBtn").addEventListener("click", userPlay);
el("passBtn").addEventListener("click", userPass);
el("hintBtn").addEventListener("click", suggestUserPlay);
el("clearSelectionBtn").addEventListener("click", clearUserSelection);
el("skillBtn").addEventListener("click", useUserSkill);
el("guideBtn").addEventListener("click", openGuide);
el("guideCloseBtn").addEventListener("click", closeGuide);
el("guidePrevBtn").addEventListener("click", () => moveGuide(-1));
el("guideNextBtn").addEventListener("click", () => moveGuide(1));
el("catalogBtn").addEventListener("click", () => openCatalog());
el("catalogCloseBtn").addEventListener("click", closeCatalog);
el("settingsBtn").addEventListener("click", openSettings);
el("settingsCloseBtn").addEventListener("click", closeSettings);
el("muteBtn").addEventListener("click", toggleMute);
el("volumeSlider").addEventListener("input", (event) => setVolume(event.target.value));
el("speedNormalBtn").addEventListener("click", () => setAiSpeed("normal"));
el("speedFastBtn").addEventListener("click", () => setAiSpeed("fast"));
el("newRoundBtn").addEventListener("click", restartCurrentMatch);
el("backSelectBtn").addEventListener("click", backToHeroSelect);
document.addEventListener("keydown", handleKeyboardShortcuts);
document.addEventListener("click", handleGlobalClick);

setupHeroSelect();
renderLog();
renderGuideStep();
renderCatalog();
renderSettings();

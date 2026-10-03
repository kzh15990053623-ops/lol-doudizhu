import { useState } from "react";
import { useGame } from "../app/GameProvider";
import { GUIDE_STEPS, HEROES, HERO_BY_ID, EMPOWER_BUFF_BY_HERO, TARGETED_SKILL_HEROES, enemyPlayers, recoverableCards, buffDescriptions, formatCards, matchScore, playerWon, analyzeSelection } from "../domain";
import { HeroPortrait } from "./HeroPortrait";
import { ModalDialog } from "./ModalDialog";
import styles from "./Dialogs.module.css";

export function Overlays() {
  const { ui } = useGame();
  return (
    <>
      <GuideDialog />
      <CatalogDialog />
      <SettingsDialog />
      <MenuDialog />
      <ResultDialog />
      {ui.overlay === "skill" ? <SkillDialog /> : null}
      <HistoryDialog />
      <RecordsDialog />
      <LeaveDialog />
    </>
  );
}

function GuideDialog() {
  const { ui, closeOverlay } = useGame();
  const [step, setStep] = useState(0);
  const open = ui.overlay === "guide";
  const closeGuide = () => {
    setStep(0);
    closeOverlay();
  };
  const current = GUIDE_STEPS[step];
  return (
    <ModalDialog open={open} onClose={closeGuide} eyebrow={`玩法指引 · ${step + 1}/${GUIDE_STEPS.length}`} title={current.title}>
      {open ? (
        <>
          <div className={styles.guideVisual} aria-hidden="true">
            <span>{String(step + 1).padStart(2, "0")}</span>
            <i />
          </div>
          <p className={styles.guideText}>{current.body}</p>
          <ol className={styles.dots} aria-label="指引进度">
            {GUIDE_STEPS.map((guide, index) => (
              <li key={guide.title} className={index === step ? styles.currentDot : ""}>
                <span className="sr-only">{guide.title}</span>
              </li>
            ))}
          </ol>
          <footer className={styles.dialogActions}>
            <button type="button" onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0}>
              上一步
            </button>
            {step < GUIDE_STEPS.length - 1 ? (
              <button type="button" className={styles.primary} onClick={() => setStep((value) => value + 1)}>
                下一步
              </button>
            ) : (
              <button type="button" className={styles.primary} onClick={closeGuide}>
                开始对局
              </button>
            )}
          </footer>
        </>
      ) : null}
    </ModalDialog>
  );
}

function CatalogDialog() {
  const { ui, closeOverlay, setCatalogHero } = useGame();
  const open = ui.overlay === "catalog";
  const hero = HERO_BY_ID[ui.catalogHeroId];
  return (
    <ModalDialog open={open} onClose={closeOverlay} eyebrow="英雄与城邦" title="符文图鉴" size="wide">
      {open ? (
        <div className={styles.catalog}>
          <nav className={styles.heroTabs} aria-label="选择英雄">
            {HEROES.map((candidate) => (
              <button
                key={candidate.id}
                type="button"
                className={candidate.id === hero.id ? styles.selectedHeroTab : ""}
                aria-pressed={candidate.id === hero.id}
                onClick={() => setCatalogHero(candidate.id)}
              >
                <span>{candidate.mark}</span>
                {candidate.name}
              </button>
            ))}
          </nav>
          <article className={styles.heroDetail} style={{ "--hero-color": hero.color } as React.CSSProperties}>
            <header>
              <HeroPortrait hero={hero} size="large" />
              <div>
                <span className={styles.cityLabel}>{hero.city}</span>
                <h3>{hero.name}</h3>
                <p>每局一次主动技能 · 成为地主时激活城邦</p>
              </div>
            </header>
            <section>
              <span>主动 · 每局一次</span>
              <h4>{hero.skillName}</h4>
              <p>{hero.skillDescription}</p>
            </section>
            <section>
              <span>地主城邦</span>
              <h4>{hero.fieldName}</h4>
              <p>{hero.fieldDescription}</p>
            </section>
          </article>
        </div>
      ) : null}
    </ModalDialog>
  );
}

function SettingsDialog() {
  const { game, ui, settings, closeOverlay, updateSettings, returnToHeroSelect } = useGame();
  return (
    <ModalDialog open={ui.overlay === "settings"} onClose={closeOverlay} eyebrow="本地偏好" title="牌桌设置">
      <div className={styles.settingsList}>
        <label className={styles.settingRow} htmlFor="voice-enabled">
          <span>
            <b>游戏音效与英雄语音</b>
            <small>选牌、出牌、技能和胜负反馈</small>
          </span>
          <input
            id="voice-enabled"
            type="checkbox"
            checked={!settings.muted}
            onChange={(event) => updateSettings({ muted: !event.target.checked })}
          />
        </label>
        <label className={styles.volumeRow} htmlFor="voice-volume">
          <span>
            <b>游戏音量</b>
            <output>{Math.round(settings.volume * 100)}%</output>
          </span>
          <input
            id="voice-volume"
            type="range"
            aria-label="语音音量"
            min="0"
            max="1"
            step="0.05"
            value={settings.volume}
            disabled={settings.muted}
            onChange={(event) => updateSettings({ volume: Number(event.target.value) })}
          />
        </label>
        <fieldset className={styles.speedField}>
          <legend>AI 行动速度</legend>
          <label htmlFor="ai-speed-normal">
            <input
              id="ai-speed-normal"
              type="radio"
              name="ai-speed"
              value="normal"
              checked={settings.aiSpeed === "normal"}
              onChange={() => updateSettings({ aiSpeed: "normal" })}
            />
            <span>
              <b>标准</b>
              <small>保留思考节奏</small>
            </span>
          </label>
          <label htmlFor="ai-speed-fast">
            <input
              id="ai-speed-fast"
              type="radio"
              name="ai-speed"
              value="fast"
              checked={settings.aiSpeed === "fast"}
              onChange={() => updateSettings({ aiSpeed: "fast" })}
            />
            <span>
              <b>快速</b>
              <small>缩短回合等待</small>
            </span>
          </label>
        </fieldset>
      </div>
      <fieldset className={styles.speedField}><legend>AI 难度（与速度独立）</legend>
        <label><input type="radio" name="difficulty" checked={settings.difficulty === "casual"} onChange={() => updateSettings({ difficulty: "casual" })} /><span><b>休闲</b><small>保留配合，允许次优选择</small></span></label>
        <label><input type="radio" name="difficulty" checked={settings.difficulty === "standard"} onChange={() => updateSettings({ difficulty: "standard" })} /><span><b>标准</b><small>控牌、配合与技能决策</small></span></label>
      </fieldset>
      {game.phase !== "heroSelect" ? (
        <footer className={styles.settingsFooter}>
          <button type="button" className={styles.dangerAction} onClick={returnToHeroSelect}>
            返回英雄选择
          </button>
          <span>当前牌局进度将被清空</span>
        </footer>
      ) : null}
    </ModalDialog>
  );
}

function MenuDialog() {
  const { ui, closeOverlay, openOverlay } = useGame();
  const openTarget = (target: "guide" | "catalog" | "settings" | "history" | "records") => {
    closeOverlay();
    window.setTimeout(() => openOverlay(target), 0);
  };
  return (
    <ModalDialog open={ui.overlay === "menu"} onClose={closeOverlay} eyebrow="横屏工具" title="牌桌菜单">
      <div className={styles.menuGrid}>
        <button type="button" onClick={() => openTarget("guide")}>
          <span aria-hidden="true">?</span>
          <b>玩法指引</b>
          <small>规则、快捷键与横屏操作</small>
        </button>
        <button type="button" onClick={() => openTarget("catalog")}>
          <span aria-hidden="true">◇</span>
          <b>英雄图鉴</b>
          <small>主动技能与城邦被动</small>
        </button>
        <button type="button" onClick={() => openTarget("settings")}>
          <span aria-hidden="true">⚙</span>
          <b>牌桌设置</b>
          <small>语音音量与 AI 速度</small>
        </button>
        <button type="button" onClick={() => openTarget("history")}><span aria-hidden="true">≡</span><b>对局记录与状态</b><small>已知牌、技能与全部行动</small></button>
        <button type="button" onClick={() => openTarget("records")}><span aria-hidden="true">♜</span><b>我的战绩</b><small>最近 20 局与英雄首胜徽章</small></button>
      </div>
    </ModalDialog>
  );
}

function ResultDialog() {
  const { game, ui, restartMatch, returnToHeroSelect, openOverlay } = useGame();
  const open = ui.overlay === 'result';
  if (game.winnerId === null || game.landlordId === null) return null;
  const winner = game.players[game.winnerId];
  const self = game.players[0];
  const won = playerWon(game);
  const played = open ? game.history.filter(entry => entry.playerId === 0 && (entry.kind === 'play' || entry.kind === 'beat')) : [];
  const bonusCards = Math.max(0, (game.landlordId === 0 ? 20 : 17) - played.reduce((n, entry) => n + entry.cards.length, 0) - self.hand.length);
  const turningPoints = open ? game.events.filter(event => (event.kind === 'skill' || event.kind === 'passive') && (event.viewerId === undefined || event.viewerId === 0)).slice(-4) : [];
  return <ModalDialog open={open} onClose={() => undefined} eyebrow={game.training ? '练习结束 · 不计战绩' : '牌局结算'} title={`${won ? '你赢了' : '本局落败'} · ${game.winnerId === game.landlordId ? '地主胜利' : '农民胜利'}`} dismissible={false}>
    {open ? <>
    <div className={styles.resultHero}><HeroPortrait hero={self.hero} size="large" eager /><div><span>{self.role} · {self.hero.city}</span><h3>{game.training ? '练习完成' : `${matchScore(game) > 0 ? '+' : ''}${matchScore(game)} 分`}</h3><p>{winner.name}率先出完手牌，{won ? '你的阵营获胜' : '对方阵营获胜'}。</p></div></div>
    <dl className={styles.resultStats}><div><dt>最终倍率</dt><dd>×{game.multiplier}</dd></div><div><dt>你的出牌</dt><dd>{played.length} 手</dd></div><div><dt>技能 / 城邦减牌</dt><dd>{bonusCards} 张</dd></div></dl>
    <p>{self.usedSkill ? `已使用「${self.hero.skillName}」` : '本局未使用主动技能'} · {played.filter(entry => /沙兵|星陨|金克丝|踏前|\+1/.test(entry.label)).length} 次强化出牌</p>
    <ul className={styles.resultPlayers}>{game.players.map(player => <li key={player.id} className={playerWon(game, player.id) ? styles.winnerRow : ''}><span>{player.name} · {player.hero.name}<small>{player.hand.length ? formatCards(player.hand) : '已出完'}</small></span><b>{player.role}</b><em>{player.hand.length} 张 · {matchScore(game, player.id) > 0 ? '+' : ''}{matchScore(game, player.id)} 分</em></li>)}</ul>
    {turningPoints.length ? <section className={styles.turningPoints}><h3>关键转折</h3>{turningPoints.map(event => <p key={event.id}><b>{event.title}</b> · {event.message}</p>)}</section> : null}
    <footer className={styles.dialogActions}><button type="button" onClick={() => openOverlay('history')}>查看对局过程</button><button type="button" onClick={returnToHeroSelect}>重新选英雄</button><button type="button" className={styles.primary} onClick={game.training ? returnToHeroSelect : restartMatch} data-dialog-initial>{game.training ? '开始正式对局' : '再来一局'}</button></footer>
    </> : null}
  </ModalDialog>;
}

function SkillDialog() {
  const { game, ui, closeOverlay, confirmSkill, skillAvailability } = useGame();
  const player = game.players[0];
  const enemies = enemyPlayers(game, 0).sort((a, b) => b.hand.length - a.hand.length || a.id - b.id);
  const availableCards = recoverableCards(game);
  const [targetId, setTargetId] = useState(enemies[0]?.id);
  const [takeCardId, setTakeCardId] = useState(availableCards[0]?.id);
  const [returnCardId, setReturnCardId] = useState(player.hand.at(-1)?.id);
  const targeted = TARGETED_SKILL_HEROES.includes(player.hero.id);
  const exchange = player.hero.id === 'thresh';
  const buff = EMPOWER_BUFF_BY_HERO[player.hero.id];
  const preview = buff ? analyzeSelection({ ...game, players: game.players.map(candidate => candidate.id === 0 ? { ...candidate, buffs: { ...candidate.buffs, [buff]: true } } : candidate) }, ui.selectedCardIds) : null;
  const valid = skillAvailability.available && (!targeted || targetId !== undefined) && (!exchange || (takeCardId !== undefined && returnCardId !== undefined));
  return <ModalDialog open onClose={closeOverlay} eyebrow="主动技能 · 每局一次" title={player.hero.skillName}>
    <p className={styles.guideText}>{player.hero.skillDescription}</p>
    {targeted ? <label className={styles.skillPicker}>选择敌方<select aria-label="技能目标" value={targetId} onChange={event => setTargetId(Number(event.target.value))}>{enemies.map(enemy => <option key={enemy.id} value={enemy.id}>{enemy.name} · {enemy.hero.name} · {enemy.hand.length} 张</option>)}</select></label> : null}
    {exchange ? <div className={styles.exchangeGrid}><label className={styles.skillPicker}>取回弃牌<select aria-label="取回弃牌" value={takeCardId} onChange={event => setTakeCardId(Number(event.target.value))}>{availableCards.map(card => <option key={card.id} value={card.id}>{card.rank}{card.suit}</option>)}</select></label><label className={styles.skillPicker}>换出手牌<select aria-label="换出手牌" value={returnCardId} onChange={event => setReturnCardId(Number(event.target.value))}>{player.hand.map(card => <option key={card.id} value={card.id}>{card.rank}{card.suit}</option>)}</select></label></div> : null}
    <div className={styles.skillPreview}><b>效果预览</b><p>{targeted ? `作用于 ${game.players[targetId ?? enemies[0]?.id]?.hero.name ?? '敌方'}；不会影响队友。` : exchange ? '交换后手牌张数不变，可重新组织牌型。' : player.hero.skillSummary}</p>{preview?.cards.length ? <p>当前选牌：{preview.combo?.label ?? '尚未组成牌型'} · {preview.legal ? '发动后可出' : preview.reason}</p> : null}<small>确认后消耗本局技能；取消不消耗。</small></div>
    <footer className={styles.dialogActions}><button type="button" onClick={closeOverlay}>取消</button><button type="button" className={styles.skillAction} disabled={!valid} onClick={() => confirmSkill({ ...(targeted ? { targetId } : {}), ...(exchange ? { takeCardId, returnCardId } : {}) })}>确认发动</button></footer>
  </ModalDialog>;
}

function HistoryDialog() {
  const { game, ui, closeOverlay } = useGame();
  const open = ui.overlay === 'history';
  const known = open ? game.knownCards.filter(entry => entry.viewerId === null || entry.viewerId === 0) : [];
  const events = open ? game.events.filter(event => event.viewerId === undefined || event.viewerId === 0) : [];
  return <ModalDialog open={open} onClose={closeOverlay} title="对局记录与状态" eyebrow="公开信息与自己的侦查结果" size="wide">
    {open ? <>
    <section className={styles.stateList}><h3>当前状态</h3>{game.landlordId !== null ? <p><b>城邦 · {game.players[game.landlordId].hero.fieldName}</b> — {game.players[game.landlordId].hero.fieldDescription}</p> : null}{game.players.map(player => <p key={player.id}><b>{player.name} · {player.hero.name}</b> — {buffDescriptions(player).join('；') || '无额外状态'}</p>)}</section>
    <section><h3>已知手牌</h3>{known.length ? known.map((entry, index) => <p key={`${entry.card.id}:${index}`}>{game.players[entry.playerId].name}：<b>{entry.card.rank}{entry.card.suit}</b> · {entry.source}</p>) : <p>暂无侦查信息。已知牌离开对方手牌后会自动移除。</p>}</section>
    <section><h3>公开弃牌</h3><p>{formatCards(game.discardPile) || '尚无弃牌'}</p></section>
    <section><h3>完整行动记录</h3><ol className={styles.fullHistory}>{[...game.history].reverse().map(entry => <li key={entry.id}><b>{entry.playerName} · {entry.label}</b><span>{formatCards(entry.cards) || (entry.kind === 'pass' ? '不要' : '获得首出权')}</span></li>)}</ol></section>
    <section><h3>技能与回合事件</h3><ol className={styles.fullHistory}>{events.map(event => <li key={event.id}><b>{event.title}</b><span>{event.message}</span></li>)}</ol></section>
    </> : null}
  </ModalDialog>;
}

function RecordsDialog() {
  const { profile, ui, closeOverlay } = useGame();
  const open = ui.overlay === 'records';
  return <ModalDialog open={open} onClose={closeOverlay} title="我的战绩" eyebrow="保存在本机 · 最近 20 局" size="wide">
    {open ? <>
    <h3>英雄首胜 · {Object.keys(profile.heroWins).length}/12</h3><div className={styles.badges}>{HEROES.map(hero => <div key={hero.id} className={profile.heroWins[hero.id] ? styles.earnedBadge : ''}><b>{profile.heroWins[hero.id] ? '◆' : '◇'} {hero.name}</b><span>{profile.heroWins[hero.id] ? `${profile.heroWins[hero.id]} 胜 · 首胜已达成` : '等待第一场胜利'}</span></div>)}</div>
    <h3>最近对局</h3>{profile.records.length ? <div className={styles.recordsTable}><table><thead><tr><th>英雄 / 阵营</th><th>结果</th><th>积分</th><th>难度</th></tr></thead><tbody>{profile.records.map(record => <tr key={record.id}><td>{HERO_BY_ID[record.heroId].name} · {record.role}</td><td className={record.won ? styles.successText : styles.dangerText}>{record.won ? '胜利' : '落败'}</td><td>{record.score > 0 ? '+' : ''}{record.score}</td><td>{record.difficulty === 'standard' ? '标准' : '休闲'}</td></tr>)}</tbody></table></div> : <p>完成第一局，留下你的第一条战绩。练习局不计入。</p>}
    </> : null}
  </ModalDialog>;
}

function LeaveDialog() {
  const { ui, closeOverlay, confirmLeave } = useGame();
  return <ModalDialog open={ui.overlay === 'confirmLeave'} onClose={closeOverlay} title="放弃当前牌局？" eyebrow="当前进度已经自动保存"><p>返回选英雄会清除这局尚未结束的进度，不会影响历史战绩。</p><footer className={styles.dialogActions}><button type="button" className={styles.primary} onClick={closeOverlay}>继续当前牌局</button><button type="button" className={styles.dangerAction} onClick={confirmLeave}>放弃并重新选英雄</button></footer></ModalDialog>;
}

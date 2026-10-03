// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { createInitialGame, gameReducer, saveSession, type GameEvent } from '../../domain';
import { App } from '../App';
import { GameProvider, useGame } from '../GameProvider';
import { playFeedback, stopSound } from '../sound';

vi.mock('../sound', () => ({ playFeedback: vi.fn(), stopSound: vi.fn(), setSoundVolume: vi.fn(), unlockSound: vi.fn() }));
afterEach(() => { cleanup(); vi.useRealTimers(); vi.clearAllMocks(); });

function Probe() {
  const { game, visibleEvent, ui, openOverlay, closeOverlay, updateSettings, dispatchGame } = useGame();
  return <><output data-testid="event">{visibleEvent?.message}</output><output data-testid="overlay">{ui.overlay}</output><button onClick={() => openOverlay('history')}>暂停</button><button onClick={closeOverlay}>继续</button><button onClick={() => updateSettings({ volume: 0 })}>静音</button><button onClick={() => dispatchGame({ type: 'restartMatch', seed: game.seed })}>同种子重开</button><button onClick={() => dispatchGame({ type: 'useSkill', playerId: game.turnPlayerId, expectedTurnRevision: game.turnRevision })}>新事件</button></>;
}

function fixture() {
  const initial = createInitialGame('feedback');
  const game = gameReducer(gameReducer(initial, { type: 'chooseHero', heroId: initial.heroChoices[0].id }), { type: 'bid', call: true });
  const event = (id: number, kind: GameEvent['kind'], message: string, viewerId?: number): GameEvent => ({ id, kind, title: message, message, announcement: message, actorId: 1, targetId: 0, operationId: 9, ...(viewerId === undefined ? {} : { viewerId }) });
  game.events = [event(1, 'skill', '主动技能'), event(2, 'info', '敌方私密侦查', 2), event(3, 'passive', '城邦触发'), event(4, 'result', '本局结束')];
  game.eventRevision = 4;
  return game;
}

it('依次呈现同次操作的技能、城邦、结算；过滤敌方私密信息，结算不盖住播报', () => {
  vi.useFakeTimers();
  const game = fixture(); game.phase = 'finished'; game.winnerId = 1;
  render(<GameProvider initialGame={game} aiEnabled={false} storage={null}><Probe /></GameProvider>);
  expect(screen.getByTestId('event')).toHaveTextContent('主动技能');
  expect(screen.getByTestId('overlay')).toBeEmptyDOMElement();
  act(() => vi.advanceTimersByTime(550));
  expect(screen.getByTestId('event')).toHaveTextContent('城邦触发');
  act(() => vi.advanceTimersByTime(550));
  expect(screen.getByTestId('event')).toHaveTextContent('本局结束');
  expect(screen.getByTestId('overlay')).toBeEmptyDOMElement();
  act(() => vi.advanceTimersByTime(550));
  expect(screen.getByTestId('overlay')).toHaveTextContent('result');
  expect(vi.mocked(playFeedback).mock.calls.map(([event]) => event.id)).toEqual([1, 3, 4]);
});

it('弹层暂停事件队列，关闭不重放已播音效，音量归零立即停止音频', () => {
  vi.useFakeTimers();
  render(<GameProvider initialGame={fixture()} aiEnabled={false} storage={null}><Probe /></GameProvider>);
  fireEvent.click(screen.getByText('暂停'));
  act(() => vi.advanceTimersByTime(3000));
  expect(screen.getByTestId('event')).toHaveTextContent('主动技能');
  fireEvent.click(screen.getByText('继续'));
  expect(playFeedback).toHaveBeenCalledTimes(1);
  act(() => vi.advanceTimersByTime(550));
  expect(screen.getByTestId('event')).toHaveTextContent('城邦触发');
  vi.mocked(stopSound).mockClear();
  fireEvent.click(screen.getByText('静音'));
  expect(stopSound).toHaveBeenCalled();
});

it('同一页面重复完成练习，技能与城邦继续依次播报和播放音效', () => {
  vi.useFakeTimers();
  const { container } = render(<GameProvider seed="repeat-practice-feedback" aiEnabled={false} storage={null}><App /></GameProvider>);
  const announcement = () => container.querySelector('[aria-live]')!;
  const completePractice = () => {
    fireEvent.click(screen.getByRole('button', { name: '两分钟上手练习' }));
    act(() => vi.advanceTimersByTime(180));
    act(() => vi.advanceTimersByTime(550));
    fireEvent.click(screen.getByRole('button', { name: /提示 H/ }));
    fireEvent.click(screen.getByRole('button', { name: /超究极死神飞弹.*S/ }));
    fireEvent.click(screen.getByRole('button', { name: '确认发动' }));
    expect(announcement()).toHaveTextContent('超究极死神飞弹');
    act(() => vi.advanceTimersByTime(550));
    fireEvent.click(screen.getByRole('button', { name: /出牌 P/ }));
    expect(announcement()).toHaveTextContent('失控爆燃触发');
    act(() => vi.advanceTimersByTime(550));
    expect(announcement()).toHaveTextContent('金克丝炸弹');
    act(() => vi.advanceTimersByTime(180));
    expect(vi.mocked(playFeedback).mock.calls.map(([event]) => event.title)).toEqual(['英雄就位', '地主确认', '超究极死神飞弹', '失控爆燃', '首出']);
  };
  completePractice();
  fireEvent.click(screen.getByRole('button', { name: '开始正式对局' }));
  expect(screen.getByRole('heading', { name: '选择你的英雄' })).toBeInTheDocument();
  vi.mocked(playFeedback).mockClear();
  completePractice();
});

it('同种子重开在播报前后都获得独立音效与事件游标', () => {
  vi.useFakeTimers();
  const initial = createInitialGame('same-seed-feedback');
  const game = gameReducer(initial, { type: 'chooseHero', heroId: initial.heroChoices[0].id });
  render(<GameProvider initialGame={game} aiEnabled={false} storage={null}><Probe /></GameProvider>);
  expect(playFeedback).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByText('同种子重开'));
  expect(playFeedback).toHaveBeenCalledTimes(2);
  act(() => vi.advanceTimersByTime(180));
  fireEvent.click(screen.getByText('同种子重开'));
  expect(playFeedback).toHaveBeenCalledTimes(3);
  expect(vi.mocked(playFeedback).mock.calls.every(([event]) => event.title === '英雄就位')).toBe(true);
});

it('恢复存档不重播已存事件，后续新事件仍正常反馈', () => {
  vi.useFakeTimers();
  const initial = createInitialGame('restore-feedback');
  const game = gameReducer(gameReducer(initial, { type: 'chooseHero', heroId: initial.heroChoices[0].id }), { type: 'bid', call: true });
  const values = new Map<string, string>();
  const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
  expect(saveSession(game, storage)).toBe(true);
  render(<GameProvider aiEnabled={false} storage={storage}><Probe /></GameProvider>);
  act(() => vi.advanceTimersByTime(3000));
  expect(playFeedback).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText('新事件'));
  expect(playFeedback).toHaveBeenCalledTimes(1);
  expect(vi.mocked(playFeedback).mock.calls[0][0].id).toBeGreaterThan(game.eventRevision);
});

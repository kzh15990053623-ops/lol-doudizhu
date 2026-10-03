// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "../App";
import { GameProvider } from "../GameProvider";
import { createInitialGame, gameReducer } from "../../domain";
import type { GameState, StorageLike } from "../../domain";
import { cardAccessibleName } from "../../components/PlayingCard";

afterEach(() => { cleanup(); vi.useRealTimers(); });

function renderGame(options: { storage?: StorageLike | null; initialGame?: GameState } = {}) {
  const result = render(
    <GameProvider seed="component-tests" aiEnabled={false} storage={options.storage ?? null} initialGame={options.initialGame}>
      <App />
    </GameProvider>,
  );
  return { ...result, user: userEvent.setup() };
}

async function enterPlayingGame(storage: StorageLike | null = null) {
  const view = renderGame({ storage });
  const chooseButtons = screen.getAllByRole("button", { name: /^选择 / });
  await view.user.click(chooseButtons[0]);
  await view.user.click(screen.getByRole("button", { name: "抢地主" }));
  return view;
}

function handButtons() {
  return within(screen.getByRole("group", { name: /你的手牌/ })).getAllByRole("button");
}

describe("React 牌桌关键交互", () => {
  it("完成选英雄和抢地主，并只保留一个礼貌播报区域", async () => {
    const { container, user } = renderGame();
    expect(screen.getByRole("heading", { name: "选择你的英雄" })).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: /^选择 / })[0]);
    expect(screen.getByRole("region", { name: "抢地主操作" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "抢地主" }));
    expect(screen.getByRole("region", { name: /你，.*地主，剩余 20 张牌/ })).toBeInTheDocument();
    expect(container.querySelectorAll("[aria-live]")).toHaveLength(1);
  });

  it("选牌重渲染后保持原卡牌焦点，方向键执行 roving tabindex", async () => {
    const { user } = await enterPlayingGame();
    const cards = handButtons();
    cards[0].focus();
    await user.keyboard("{Space}");
    expect(cards[0]).toHaveAttribute("aria-pressed", "true");
    expect(cards[0]).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(cards[1]).toHaveFocus();
    expect(cards[1]).toHaveAttribute("tabindex", "0");
    expect(cards[0]).toHaveAttribute("tabindex", "-1");
  });

  it("提示自动选择并聚焦第一张建议牌", async () => {
    const { user } = await enterPlayingGame();
    await user.click(screen.getByRole("button", { name: /提示/ }));
    await waitFor(() => {
      const selected = handButtons().filter((button) => button.getAttribute("aria-pressed") === "true");
      expect(selected.length).toBeGreaterThan(0);
      expect(selected[0]).toHaveFocus();
    });
  });

  it("键盘打开设置不会出牌，关闭后恢复触发按钮焦点", async () => {
    const { user } = await enterPlayingGame();
    const cards = handButtons();
    await user.click(cards[4]);
    const settingsButton = screen.getByRole("button", { name: "设置" });
    settingsButton.focus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("dialog", { name: "牌桌设置" })).toBeInTheDocument();
    expect(screen.getByText("等待首出")).toBeInTheDocument();
    expect(handButtons()).toHaveLength(20);
    await user.click(screen.getByRole("button", { name: "关闭" }));
    await waitFor(() => expect(settingsButton).toHaveFocus());
  });

  it("出牌移除焦点卡后聚焦相邻手牌", async () => {
    const { user } = await enterPlayingGame();
    const cards = handButtons();
    const selectedIndex = 5;
    const expectedNeighbor = cards[selectedIndex + 1];
    await user.click(cards[selectedIndex]);
    expect(cards[selectedIndex]).toHaveFocus();
    await user.keyboard("p");
    await waitFor(() => {
      expect(handButtons()).toHaveLength(19);
      expect(expectedNeighbor).toHaveFocus();
    });
  });

  it("展示禁用原因并持久化兼容设置", async () => {
    const values = new Map<string, string>();
    const storage: StorageLike = {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
    };
    const { user } = await enterPlayingGame(storage);
    expect(screen.getByRole("button", { name: /不要/ })).toHaveAttribute("title", "你是本轮首家，需要出牌");
    expect(screen.getByRole("button", { name: /出牌/ })).toHaveAttribute("title", "请选择要出的牌");
    await user.click(screen.getByRole("button", { name: "设置" }));
    const volume = screen.getByRole("slider", { name: /语音音量/ });
    fireEvent.change(volume, { target: { value: "0.4" } });
    await user.click(screen.getByRole("checkbox", { name: /英雄语音/ }));
    await waitFor(() => {
      expect(JSON.parse(values.get("runeterra-ddz-settings-v1") ?? "{}")).toMatchObject({ muted: true, volume: 0.4 });
    });
  });

  it("在放大的中央牌区保留对手出牌和过牌记录", () => {
    let playing = createInitialGame("opponent-history");
    playing = gameReducer(playing, { type: "chooseHero", heroId: playing.heroChoices[0].id });
    playing = gameReducer(playing, { type: "bid", call: true });
    const opponentCard = playing.players[1].hand[0];
    playing.currentPlay = {
      playerId: 1,
      cards: [opponentCard],
      combo: { type: "single", value: opponentCard.value, length: 1, label: "单牌" },
    };
    playing.history = [
      {
        id: 2,
        playerId: 1,
        playerName: playing.players[1].name,
        heroName: playing.players[1].hero.name,
        label: "单牌",
        cards: [opponentCard],
        kind: "play",
        targetId: null,
      },
      {
        id: 1,
        playerId: 2,
        playerName: playing.players[2].name,
        heroName: playing.players[2].hero.name,
        label: "过牌",
        cards: [],
        kind: "pass",
        targetId: null,
      },
    ];

    renderGame({ initialGame: playing });
    const center = screen.getByRole("region", { name: "中央出牌区" });
    expect(within(center).getByRole("img", { name: cardAccessibleName(opponentCard) })).toBeInTheDocument();
    const history = within(center).getByRole("region", { name: "对手出牌记录" });
    expect(within(history).getAllByRole("listitem")).toHaveLength(2);
    expect(within(history).getByRole("listitem", { name: /AI 1，单牌/ })).toBeInTheDocument();
    expect(within(history).getByRole("listitem", { name: /AI 2，不要/ })).toBeInTheDocument();
  });

  it("结束状态打开结果 dialog 并提供下一局操作", () => {
    vi.useFakeTimers();
    let finished = createInitialGame("finished-state");
    finished = gameReducer(finished, { type: "chooseHero", heroId: finished.heroChoices[0].id });
    finished = gameReducer(finished, { type: "bid", call: true });
    finished.phase = "finished";
    finished.winnerId = 0;
    finished.players[0].hand = [];
    renderGame({ initialGame: finished });
    for (let index = 0; index <= finished.events.length; index++) act(() => { vi.advanceTimersByTime(550); });
    expect(screen.getByRole("dialog", { name: /地主胜利/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "再来一局" })).toBeInTheDocument();
    expect(screen.getByText(/最终倍率/)).toBeInTheDocument();
  });
});

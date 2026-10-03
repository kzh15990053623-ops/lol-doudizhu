# 符文之地斗地主 — 优化实施变更摘要（v2 方案）

- **日期**：2026-09-20
- **复审补充日期**：2026-09-21
- **范围**：基于《项目审阅与优化方案 v2》实施，采纳全部外部评审反馈
- **性质**：2 处正确性修复 + 1 处渲染开销优化 + 4 处维护性/工程改进；不改变玩法、结算、AI 策略与存档 schema（`RULES_VERSION` 不变）
- **初次验收（2026-09-20）**：typecheck/lint 零警告、55/55 单测、15/15 浏览器回归（含 axe 无障碍）、构建预算达标、300 局卡莎对局 RNG 快照逐字段一致。后续评审修正见第六节。

---

## 一、正确性修复（P1）

### 1.1 卡莎城邦「虚空干扰」事件归属修复 + 逻辑合并

**文件**：`src/domain/engine.ts`

**修复的缺陷**：同一被动存在两份实现且事件归属不一致——
- 出牌路径（原 `handleAfterPlay` 内）：`emitEvent(..., { playerId: target.id })`，发动者被错误记录为受影响的农民；文案「不能使用炸弹」；
- reducer 路径（原 `gameReducer` 内）：`{ playerId: landlord.id, targetId: target.id }`（正确）；文案「禁止炸弹和火箭」；随机目标硬编码 `* 2`。

**实际影响**：出牌路径下，事件元数据把受影响农民记成了发动者，并缺少明确的目标字段。本次修复统一了事件发动者与目标的归属。`虚空干扰` 属于被动事件，当前 `sound.ts` 为其播放通用被动音效；英雄语音仅用于主动发动技能，因此这不是修复“播放了农民英雄语音”的问题。

**改动**：
- 提取私有函数 `maybeTriggerKaisaField(state, landlord)`，两条路径统一调用；
- 归属统一：`playerId` / `actorId` = 卡莎地主，`targetId` = 被禁炸农民；
- 文案统一：「下次出牌不能使用炸弹或火箭」（与 `heroes.ts` 英雄描述一致）；
- 随机目标统一为 `enemyPlayers(state, landlord.id)` 及其长度，去掉硬编码。

**确定性验证**：改动前后各跑 300 局卡莎地主完整 AI 对局快照（rngState / winnerId / multiplier / 手牌 / 弃牌），300/300 局逐字段一致，确认随机数消耗与对局走向未变。

### 1.2 存档回合一致性校验 + passTurn 去非空断言

**文件**：`src/domain/progress.ts`、`src/domain/engine.ts`

**修复的缺陷**（评审中复现确认）：
- `validSavedGame` 原只校验 `responseQueue` / `passedPlayerIds` 的元素唯一性与座位范围，不校验与 `currentPlay.playerId`、`turnPlayerId` 的一致性。损坏队列（如领出者被放入响应队列）可通过校验，恢复后过牌会出现「领出者响应自己的牌」；
- `passTurn` 末尾 `next.players.find(...)!` 非空断言，状态损坏时抛 TypeError；任何「回退下一家」的兜底都是在猜回合归属。

**改动**：
- `validSavedGame` 校验以下回合不变量，任一不满足即拒绝恢复：
  1. `passCount === passedPlayerIds.length`
  2. `turnPlayerId ∉ passedPlayerIds`
  3. `responseQueue ∩ passedPlayerIds = ∅`
  4. `currentPlay.playerId ∉ responseQueue 且 ∉ passedPlayerIds`（有领出牌时）
  5. 队列非空时 `turnPlayerId === responseQueue[0]`
  6. `currentPlay` 存在性 ≡ `responseQueue` 非空
  7. 队列完整包含所有尚未过牌、且不是领出者的响应玩家；等待首出时没有已过牌玩家或待恢复行动者。抢地主阶段也不能残留响应状态。
  8. `interruptedNext` 非空时，必须是已触发盖伦城邦后的地主额外行动，尚无过牌，且恢复目标是响应队列中的第二名玩家。
- `passTurn` 去掉 `!`：找不到合法候选时 `rejectCommand(state, "回合状态异常，请重新开始牌局")`（防御分支，正常流程不可达）。

**安全性核对**：成功出牌后清空已过牌集合，并以当前行动者重建响应队列；两家过牌后，重新首出并清空响应队列、已过牌集合和待恢复行动者。盖伦额外行动时队列为“地主、另一响应者”，额外出牌或过牌后恢复后者。合法中局通过逐行动存档检查和盖伦续局测试验证。

### 1.3 弹层按需渲染（保留外壳的最小方案）

**文件**：`src/components/Overlays.tsx`

**问题**：8 个 Dialog 中 7 个始终挂载，每次游戏状态变化（每个 AI 行动）都执行 `events.filter`、`history.reverse().map` 等对最多 500 条记录的运算。

**方案**（按评审建议选择保守路线）：保留全部 `ModalDialog` 外壳与 `open` 驱动逻辑不动，仅在各 Dialog 内部关闭时跳过昂贵内容组装——
- GuideDialog / CatalogDialog / HistoryDialog / RecordsDialog / ResultDialog：`open` 为 false 时 children 渲染 `null`，过滤/映射计算以 `open` 为前置条件；
- SettingsDialog / MenuDialog / LeaveDialog 内容轻量，未改。

**明确不做**：不整体卸载 Dialog 组件——规避焦点恢复、弹层切换、触发按钮消失/禁用、延迟聚焦等交互风险。焦点管理、`showModal/close`、StrictMode 双执行路径零改动。

---

## 二、维护性与工程改进（P2/P3）

### 2.1 英雄技能映射提取到领域层

**文件**：`src/domain/heroes.ts`（新增导出）、`src/domain/ai.ts`、`src/domain/rules.ts`、`src/domain/engine.ts`、`src/components/Overlays.tsx`

- 新增 `TARGETED_SKILL_HEROES: readonly HeroId[]`（ashe/teemo/caitlyn），替换 3 处重复数组；
- 新增 `EMPOWER_BUFF_BY_HERO: Partial<Record<HeroId, keyof PlayerBuffs>>`（garen/yasuo/jinx/azir/pantheon → buff key），替换 2 处重复对象字面量；
- 新增英雄时不再需要多点同步。纯重构，无行为变化。

### 2.2 文档与注释

- `README.md`：准确说明现有入口差异——开发服务器显式指定 `?seed=` 时跳过续局；生产构建优先恢复有效存档（包含已结束结算），无有效存档时才读取 seed。要在生产构建中重设种子，先从游戏内返回英雄选择以清除进度，再打开带 seed 的地址。本次只修正文档，入口行为不变。
- `src/main.tsx`：开发预览直接突变 GameState 处加注释，说明其绕过 reducer、仅供 `?scenario=result` 画面检查。

### 2.3 遗留日志清理

删除根目录 12 个调试日志（`debug.log`、`localhostrun-*.log`、`localtunnel-*.log`，约 48 KB），`.gitignore` 已覆盖相应模式。

### 2.4 测试拆分与快速入口

- 千局模拟用例从 `quality.test.ts` 拆至独立的 `quality.simulation.test.ts`；
- `npm test` 保持全量（初次验收时 55 用例，约 50s，关键验证不默认跳过）；
- 新增 `npm run test:fast`（排除模拟文件，初次验收时 54 用例，约 25s）作为日常快速反馈入口；
- `build:release` 口径不变。

### 2.5 快捷键监听：保留现状（原 P2-1 降级）

`GameProvider` 每次状态变化重绑 keydown 监听的开销可忽略；渲染期写 ref 的优化写法会触发当前依赖（eslint-plugin-react-hooks 7.x）recommended 集中的 `react-hooks/refs` 错误，React 官方亦反对。按评审建议**不实施**，待确有需要时用「提交后的 Effect 中同步回调 ref」的正确写法。

---

## 三、初次实施新增测试

| 文件 | 用例 | 断言要点 |
| --- | --- | --- |
| `src/domain/__tests__/engine.test.ts` | 虚空干扰归属（新增） | 出牌触发时事件 `playerId/actorId`=0（地主）、`targetId`=被禁炸农民、只触发 1 次 |
| `src/domain/__tests__/quality.test.ts` | 卡莎主动技能（补充断言） | 事件数恰为 1 |
| `src/domain/__tests__/quality.test.ts` | 损坏存档拒绝恢复（新增） | 以真实出牌中局为基线，构造 5 种破坏（领出者入队 / 行动者已过牌 / passCount 不一致 / turnPlayerId 错位 / 队列清空但 currentPlay 存在），全部拒绝恢复；合法中局仍可保存-恢复 round-trip |

---

## 四、初次验证结果（2026-09-20）

| 检查项 | 命令 | 结果 |
| --- | --- | --- |
| 类型检查（strict） | `npm run typecheck` | 0 错误 |
| Lint（--max-warnings 0） | `npm run lint` | 0 警告 |
| 单元测试（全量） | `npm test` | 55/55 通过（含千局模拟 16.2s） |
| 单元测试（快速） | `npm run test:fast` | 54/54 通过（25s） |
| 浏览器回归 | `npx playwright test` | 15/15 通过（含 3 项 axe A/AA 无障碍、刷新恢复牌局、visibilitychange 暂停等） |
| 发布构建 | `npm run build:release` | 通过；dist 1.74/4.00 MiB，runtime 0.90/1.50 MiB |
| RNG 确定性快照 | 300 局卡莎对局前后比对 | 300/300 逐字段一致 |

---

## 五、兼容性与遗留说明

- `RULES_VERSION`、存档 schema（schemaVersion 2）均未变更；P1-2 只让原本会被错误恢复的损坏存档更早被拒绝，合法存档与续局行为不变（e2e 验证）。
- 未实施项：快捷键监听优化（见 2.5，按评审建议保留现状）。
- 既有设计取舍未动：6 名英雄无技能语音、`estimateTurns` 的 `start = 2` 重扫技巧（有注释且被千局测试覆盖）。
- 本轮涉及文件：`src/domain/engine.ts`、`src/domain/progress.ts`、`src/domain/heroes.ts`、`src/domain/ai.ts`、`src/domain/rules.ts`、`src/components/Overlays.tsx`、`src/main.tsx`、`package.json`、`README.md`、测试文件 3 个（1 新增 2 修改）。

---

## 六、复审补充修复与验收（2026-09-21）

### 6.1 补齐存档恢复校验

- 拒绝遗漏尚未过牌玩家的响应队列，防止恢复后提前结束响应或丢失下一位行动者。
- 校验盖伦额外行动的 `interruptedNext`：必须由盖伦地主已触发的城邦效果产生，指向队列中的另一响应者，不能指向领出者或当前行动者。
- 抢地主及等待首出阶段不得残留响应队列、已过牌玩家或待恢复行动者。
- 保持 `RULES_VERSION = 2` 和现有存档结构；本次未修改引擎、AI 策略或 seed 入口行为。

### 6.2 回归用例与文档修正

- 扩展损坏存档测试，覆盖队列缺人、错误恢复目标、错误英雄、缺少城邦触发标记和残留响应状态。
- 增加 4 组盖伦合法续局测试：两个不同座位压制盖伦后，保存并恢复，再分别选择出牌或过牌，检查后续响应顺序和新一轮首出。
- 千局模拟从仅校验终局存档，扩展为校验开始出牌时及每次行动后的存档，覆盖合法中局兼容性。
- 修正 README 与本摘要对开发 / 生产 seed 优先级的描述，以及卡莎被动事件对音效影响的描述（见 1.1、2.2）。

### 6.3 本次实测结果

| 检查项 | 命令 | 结果 |
| --- | --- | --- |
| 类型检查与 Lint | `npm run check` | 通过，0 错误、0 警告 |
| 单元测试（全量） | `npm test -- --reporter=dot` | 61/61 通过，包含 1,000 局逐行动存档校验 |
| 浏览器回归 | `npm run test:e2e` | 15/15 通过，包含无障碍、刷新续局、暂停恢复及完整对局 |
| 发布构建与资源预算 | `npm run build:release` | 通过；dist 1.74/4.00 MiB，runtime 0.90/1.50 MiB；禁止文件 0 个 |

本次修改共 5 个文件：`src/domain/progress.ts`、`src/domain/__tests__/quality.test.ts`、`src/domain/__tests__/quality.simulation.test.ts`、`README.md`、本摘要。第 1.1 节和第四节的 300 局 RNG 前后快照比对为初次验收记录，本次未重复执行该比对。

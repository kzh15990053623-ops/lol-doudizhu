# UI 页面统一与中央出牌区验收

日期：2026-10-02。范围：执行稿 #3 与 #4，沿用曜石鎏金和史诗 CG 方向。

## 已完成

- 英雄选秀、结算/暂停/技能/设置等弹窗、事件播报和提示面板统一为现有黑曜石材质、鎏金描边、雕刻衬线标题。主按钮金箔、次按钮黑曜石、危险/技能按钮赤红。
- 城邦功能色保留在小标识、标签和细条上；事件和成功/警告/危险状态色语义保留。
- 桌面和手机中央横幅集中出牌方、牌型、比较点数、最新首出/压过/不要状态与过牌计数。操作提示仍在 ActionBar 按钮旁，移除中央重复行动提示。
- 中央卡牌宽度桌面 84px、手机 56px，按容器宽度动态调整重叠，每张至少露出 24px；不足时允许横向浏览。
- 恢复存档等持久提示收进顶部状态栏，避免遮挡中央横幅。手机练习进度也放进 HUD，维持牌桌高度预算。
- 安全区从画布有效尺寸中扣除，容器查询按有效高度执行降级：低于 386px 隐藏底牌；低于 366px 把事件标题折入横幅，同时保留最新动作状态。

## 保留项

与执行前文件副本逐字节比对，以下文件未改动：`PlayingCard.tsx`、`PlayerHand.tsx`、`ModalDialog.tsx`、`StatusAnnouncer.tsx`、`HeroDraft.tsx`。

角标、大小王竖排与暖金/冷银蓝配色、左侧选中勾、按滚动位置分别开启的两端渐隐、±6° 手机扇形、首尾 16px 留白、44px 手牌露出宽度、`aria-pressed` 和 roving tabindex 均保留。`historyCard` 独立 28px/22px 宽与 9px 角标保留。`PlayingCard.module.css` 仅调整中央 `tableCard` 尺寸与重叠规则。

未修改牌型规则、AI 或领域状态逻辑；未提交、推送或清理原有工作区改动。

## 浏览器实测高度

以下为 Chrome 页面实际矩形和计算样式，普通视口安全区为 0。

| 项目 | 844×390 | 812×375 |
| --- | ---: | ---: |
| HUD | 46px | 46px |
| 牌桌顶部 | 3px | 3px |
| AI / 中央区域 | 164px | 149px |
| 区域间距 | 4px | 4px |
| 玩家区域 | 170px | 170px |
| 牌桌底部 | 3px | 3px |
| 合计 | 390px | 375px |
| 中央行分配 | 22 / 18 / 92 / 26px，间距 2px×3 | 22 / 97 / 26px，间距 2px×2 |

中央行依次为横幅、底牌（较矮屏隐藏）、出牌容器、事件。玩家区 170px 内为边框与顶部 4px、操作 44px、间距 2px、手牌标题 18px、手牌滚动区 102px。

桌面 1600×900 实测 HUD 75.1875px、AI/中央区 524.8125px、玩家区 260px。桌面手牌滚动区留出选中上浮和扇形边缘所需空间。

额外模拟左右安全区各 24px、底部 20px：844×390 中有效画布为 796×370，底牌自动隐藏，中央行 22/92/26px，页面横纵溢出均为 0。此项是浏览器样式模拟，不能代表实体设备安全区验收。

## 验证结果

| 检查 | 结果 | 证据 |
| --- | --- | --- |
| TypeScript + ESLint | PASS | `npm.cmd run check`，0 错误/警告 |
| 单元测试 | PASS | `npm.cmd test`，6 文件 / 61 项通过，含 AI 模拟 |
| 端到端测试 | PASS | `npm.cmd run test:e2e`，23 项通过，包含 4 项 axe A/AA 测试 |
| 主流程与交互 | PASS | 键盘选牌、焦点、选中角标/勾、44px 触控、滑动、存档恢复、技能确认、练习与真实结算 |
| 中央长牌型 | PASS | 1600×900 / 844×390 / 812×375 的合法 18 张连对：每张露出至少 24px，首尾可访问 |
| 极矮横屏 | PASS | 844×350：折叠事件后“某人不要”和过牌计数仍可见，操作区在视口内 |
| 生产构建与预算 | PASS | `npm.cmd run build:release`；总产物 2.04/4.00 MiB，排除语音的运行资源 1.21/1.50 MiB，27 文件，禁止资源 0 |
| 实体手机操作 | NOT RUN | 本次验收为本机 Chrome 视口测试，未连接实体手机 |
| 线上部署 | NOT RUN | 本次仅修改和验证本地工作区 |

端到端回归新增于 `tests/e2e/ui-unification.spec.ts`。长牌型固定发牌通过生产存档校验，由真实 `gameReducer` 执行出牌/过牌，再经正式存档恢复流程展示。

## 最终截图

- [手机中央长牌型 844×390](../../output/playwright/ui-unified-long-844x390.png)
- [桌面中央长牌型 1600×900](../../output/playwright/ui-unified-long-1600x900.png)
- [手机牌桌 844×390](../../output/playwright/ui-unified-table-mobile.png)
- [较矮牌桌 812×375](../../output/playwright/ui-unified-table-short.png)
- [桌面选秀](../../output/playwright/ui-unified-draft-desktop.png)
- [手机选秀](../../output/playwright/ui-unified-draft-mobile.png)
- [桌面结算](../../output/playwright/ui-unified-result-desktop.png)
- [手机结算](../../output/playwright/ui-unified-result-mobile.png)
- [模拟安全区](../../output/playwright/ui-unified-safearea-simulated.png)

本机预览：<http://127.0.0.1:4319/>，仅在开发服务运行的这台电脑可访问。截图关闭 AI 并减少动画以便检查；结算截图采用项目内置结算场景，真实对局到结算另由端到端测试覆盖。

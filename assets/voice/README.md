# 英雄技能语音文件

这里存放英雄释放技能时播放的语音。当前语音来自用户指定的授权来源：

https://voice.twitp.com/index.html

已下载并接入：

- `garen.ogg` / `garen.mp3`
- `darius.mp3`
- `ashe.ogg` / `ashe.mp3`
- `jinx.mp3`
- `yasuo.mp3`
- `thresh.ogg` / `thresh.mp3`

在该来源中暂未找到以下英雄的详情页或可下载语音：凯特琳、阿兹尔、潘森、厄运小姐、提莫、卡莎。

当前代码通过 `src/app/heroMedia.ts` 中的 `HERO_VOICES` 显式列出可播放语音；未列入的英雄不会发起缺失文件请求。生产构建使用 `src/assets/runtime/voice/` 下的 MP3，以下列表为本目录保留的原始素材。

已配置的语音键：

- `garen.mp3` 或 `garen.ogg`
- `darius.mp3`
- `ashe.mp3` 或 `ashe.ogg`
- `jinx.mp3`
- `yasuo.mp3`
- `thresh.mp3` 或 `thresh.ogg`

建议使用 1-3 秒的短台词，作为技能反馈会比较干脆。

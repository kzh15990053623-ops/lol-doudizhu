import ashePortrait from "../assets/runtime/portraits/ashe.webp";
import azirPortrait from "../assets/runtime/portraits/azir.webp";
import caitlynPortrait from "../assets/runtime/portraits/caitlyn.webp";
import dariusPortrait from "../assets/runtime/portraits/darius.webp";
import garenPortrait from "../assets/runtime/portraits/garen.webp";
import jinxPortrait from "../assets/runtime/portraits/jinx.webp";
import kaisaPortrait from "../assets/runtime/portraits/kaisa.webp";
import missfortunePortrait from "../assets/runtime/portraits/missfortune.webp";
import pantheonPortrait from "../assets/runtime/portraits/pantheon.webp";
import teemoPortrait from "../assets/runtime/portraits/teemo.webp";
import threshPortrait from "../assets/runtime/portraits/thresh.webp";
import yasuoPortrait from "../assets/runtime/portraits/yasuo.webp";
import asheVoice from "../assets/runtime/voice/ashe.mp3";
import dariusVoice from "../assets/runtime/voice/darius.mp3";
import garenVoice from "../assets/runtime/voice/garen.mp3";
import jinxVoice from "../assets/runtime/voice/jinx.mp3";
import threshVoice from "../assets/runtime/voice/thresh.mp3";
import yasuoVoice from "../assets/runtime/voice/yasuo.mp3";
import type { HeroId } from "../domain";

export const HERO_PORTRAITS: Record<HeroId, string> = {
  garen: garenPortrait,
  darius: dariusPortrait,
  ashe: ashePortrait,
  jinx: jinxPortrait,
  caitlyn: caitlynPortrait,
  yasuo: yasuoPortrait,
  thresh: threshPortrait,
  azir: azirPortrait,
  pantheon: pantheonPortrait,
  missfortune: missfortunePortrait,
  teemo: teemoPortrait,
  kaisa: kaisaPortrait,
};

export const HERO_VOICES: Partial<Record<HeroId, string>> = {
  garen: garenVoice,
  darius: dariusVoice,
  ashe: asheVoice,
  jinx: jinxVoice,
  yasuo: yasuoVoice,
  thresh: threshVoice,
};

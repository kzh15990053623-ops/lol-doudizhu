import { HERO_VOICES } from './heroMedia';
import { HEROES, type GameEvent, type GameState, type UserSettings } from '../domain';

let context: AudioContext | null = null;
let voice: HTMLAudioElement | null = null;
let soundGeneration = 0;
export function unlockSound() {
  if (typeof AudioContext === 'undefined') return;
  try { context ??= new AudioContext(); void context.resume().catch(() => undefined); } catch { /* Audio is optional. */ }
}
export function stopSound() {
  soundGeneration++;
  voice?.pause(); voice = null;
  if (context?.state === 'running') void context.suspend().catch(() => undefined);
}
export function setSoundVolume(volume: number) { if (voice) voice.volume = volume; }
export function playFeedback(event: GameEvent, game: GameState, settings: UserSettings) {
  if (settings.muted || settings.volume <= 0) { stopSound(); return; }
  const actor = game.players[event.actorId ?? event.playerId ?? -1];
  const heroIndex = HEROES.findIndex(hero => hero.id === actor?.hero.id);
  const tones = event.kind === 'result' ? [392, 494, 587] : event.kind === 'skill' ? [220 + heroIndex * 22, 440 + heroIndex * 22] : event.kind === 'passive' ? [523, 659] : /炸弹|火箭/.test(event.message) ? [110, 82] : event.title === '过牌' ? [196] : [330];
  const generation = ++soundGeneration;
  if (context) {
    const audio = context;
    void audio.resume().then(() => {
      if (generation !== soundGeneration) return;
      tones.forEach((frequency, index) => {
        const oscillator = audio.createOscillator(); const gain = audio.createGain();
        const start = audio.currentTime + index * 0.07;
        oscillator.type = event.kind === 'skill' ? 'triangle' : 'sine'; oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0, start); gain.gain.linearRampToValueAtTime(settings.volume * 0.045, start + 0.015); gain.gain.exponentialRampToValueAtTime(0.001, start + 0.19);
        oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(start); oscillator.stop(start + 0.2);
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
      });
    }).catch(() => undefined);
  }
  if (event.kind === 'skill' && event.message.includes('发动') && actor && HERO_VOICES[actor.hero.id] && typeof Audio !== 'undefined') {
    voice?.pause(); voice = new Audio(HERO_VOICES[actor.hero.id]); voice.volume = settings.volume;
    void voice.play().catch(() => undefined);
  }
}

import { Game } from './Game.js';

const canvas = document.getElementById('game');
const game = new Game(canvas);
if (new URLSearchParams(window.location.search).has('playtest')) {
  Object.defineProperty(window, '__bridgeGame', { value: game, configurable: true });
}

const title = document.getElementById('title-screen');
document.getElementById('start-btn').addEventListener('click', () => {
  title.classList.add('hidden');
  game.start();
}, { once: true });

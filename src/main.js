import { Game } from './Game.js';

const canvas = document.getElementById('game');
const game = new Game(canvas);

const title = document.getElementById('title-screen');
document.getElementById('start-btn').addEventListener('click', () => {
  title.classList.add('hidden');
  game.start();
}, { once: true });

function point(x, y, z) { return Object.freeze({ x, y, z }); }
function room(title, subtitle, signPosition, signRotation, terminalPosition, terminalRotation = 0) {
  return Object.freeze({
    collide: false,
    sign: Object.freeze({ title, subtitle, position: signPosition, rotationY: signRotation }),
    terminal: Object.freeze({ position: terminalPosition, rotationY: terminalRotation }),
  });
}

export const BRIDGEMIND_ROOM_DETAILS = Object.freeze({
  living: room('BRIDGEMIND LOUNGE', 'THE CONTEXT NEVER SLEEPS', point(-9.84, 1.55, 5.7), Math.PI / 2, point(-6.9, 0.94, 4.6), Math.PI),
  foyer: room('BRIDGEMIND INTAKE', 'ALL AGENTS CHECK IN', point(1.25, 1.55, 7.84), Math.PI, point(1.9, 0.9, 7.35), Math.PI),
  dining: room('BRIDGEMIND STANDUP', 'SHIP BEFORE THE FOOD GETS COLD', point(9.84, 1.55, 5.0), -Math.PI / 2, point(6.5, 0.83, 5.0), 0),
  hallway: room('BRIDGEMIND PIPELINE', 'NO HUMAN IN THE LOOP', point(0, 1.5, 1.84), Math.PI, point(2.2, 0.9, 1.62), Math.PI),
  kitchen: room('BRIDGEMIND TOKEN LAB', 'CONTEXT IS A CONSUMABLE', point(9.84, 1.55, -4.7), -Math.PI / 2, point(7.0, 1.0, -7.45), 0),
  bedroom: room('BRIDGEMIND SLEEP MODE', 'BACKGROUND AGENTS STILL RUNNING', point(0, 1.55, -7.84), 0, point(0.9, 0.65, -7.5), 0),
  study: room('BRIDGEMIND WAR ROOM', 'TOKEN MAXXING IS NOT A STRATEGY', point(-9.84, 1.55, -5.2), Math.PI / 2, point(-7.1, 0.82, -6.1), Math.PI),
});

export const ROOM_TONE_FREQUENCIES = Object.freeze({
  living: 44,
  foyer: 52,
  dining: 58,
  hallway: 36,
  kitchen: 71,
  bedroom: 41,
  study: 83,
});

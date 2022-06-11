// EVENTS
let showCursor = true;
const toggleCursorEl = document.querySelector('[data-toggle-cursor]');
toggleCursorEl.addEventListener('click', () => {
  showCursor = !showCursor;

  if (showCursor) {
    toggleCursorEl.innerHTML = 'Show Real Cursor';
    document.documentElement.style.cursor = 'none';
  } else {
    toggleCursorEl.innerHTML = 'Hide Real Cursor';
    document.documentElement.style.cursor = 'default';
  }
});

if ('ontouchstart' in document.documentElement) {
  document.querySelector('.info-description').innerHTML +=
    "<div style='color:#c0392b'><b><i>Doesn't work with touchscreens tho... :(</i></b></div>";
}

document.querySelector(`[data-new-random]`).addEventListener('click', (evt) => {
  evt.preventDefault();

  const amountOfElements =
    (Math.random() > 0.8 ? 5 : 2) + Math.floor(Math.random() * 8);

  const newConfig = new Array(amountOfElements).fill('').map(() => {
    return Math.random() > 0.5
      ? {
          behavior: 'REPEL',
          innerHTML: 'Repel',
          className: ['clickme', '-nope'],
          position: [
            Math.floor(Math.random() * 92) + 4,
            Math.floor(Math.random() * 92) + 4,
          ],
        }
      : {
          behavior: 'ATTRACT',
          innerHTML: 'Attract',
          className: ['clickme'],
          position: [
            Math.floor(Math.random() * 92) + 4,
            Math.floor(Math.random() * 92) + 4,
          ],
        };
  });

  window.ControlUserCursor(newConfig);
});

// INITIALIZE
window.ControlUserCursor([
  {
    behavior: 'REPEL',
    innerHTML: 'Repel',
    className: ['clickme', '-nope'],
    position: [60, 33],
  },
  {
    behavior: 'ATTRACT',
    innerHTML: 'Attract',
    className: ['clickme'],
    position: [40, 66],
  },
]);

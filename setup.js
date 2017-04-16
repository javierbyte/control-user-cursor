Array.from(document.querySelectorAll('.options-element')).forEach(option => {
  option.addEventListener('click', () => {
    document.querySelector('.options-element.-active').classList.remove('-active');
    option.classList.add('-active');

    ControlUserCursor(kConfig[option.dataset.type], true);
  });
});

if ('ontouchstart' in document.documentElement) {
  document.querySelector('.info-description').innerHTML +=
    "<div style='color:#c0392b'><b><i>Doesn't work with touchscreens tho... :(</i></b></div>";
}

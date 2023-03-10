// config

const ASSET_CONFIG = {
  mac_retina: {
    normal: {
      src: '/control-user-cursor/assets/mac_retina.png',
      height: '22px',
      width: '15px',
    },
    pointer: {
      src: '/control-user-cursor/assets/mac_pointer_retina.png',
      width: '18.5px',
      height: '19.5px',
    },
  },
  mac: {
    normal: {
      src: '/control-user-cursor/assets/mac.png',
      width: '15px',
      height: '22px',
    },
    pointer: {
      src: '/control-user-cursor/assets/mac_pointer.png',
      width: '18px',
      height: '19px',
    },
  },
  other: {
    normal: {
      src: '/control-user-cursor/assets/other.png',
      width: '17px',
      height: '23px',
    },
    pointer: {
      src: '/control-user-cursor/assets/other_pointer.png',
      width: '22px',
      height: '26px',
    },
  },
};

function getCursorInfo() {
  let navigator = window.navigator.platform.indexOf('Mac') > -1 ? 'mac' : 'win';

  if (window.devicePixelRatio > 1) {
    navigator += '_retina';
  }

  if (Object.keys(ASSET_CONFIG).includes(navigator)) {
    return ASSET_CONFIG[navigator];
  }

  return ASSET_CONFIG.other;
}

const global = {
  mouseX: 0,
  mouseY: 0,
  trackedAstros: [],
  hoverTrackedElements: [],
  cursorInfo: getCursorInfo(),
  isMouseVisible: false,
};
const containerEl = document.querySelector('#container');
const cursorEl = document.querySelector('[data-cursor]');

setCursor(global.cursorInfo.normal);

function setCursor(cursorConfig) {
  cursorEl.src = cursorConfig.src;
  cursorEl.style.width = cursorConfig.width;
  cursorEl.style.height = cursorConfig.height;
}

window.ControlUserCursor = function ControlUserCursor(config) {
  containerEl.innerHTML = '';

  global.trackedAstros = config.map((newAstroConfig) => {
    const astroEl = document.createElement('div');
    astroEl.className = newAstroConfig.className.join(' ');
    astroEl.innerHTML = newAstroConfig.innerHTML;
    astroEl.style.left = `${newAstroConfig.position[0]}%`;
    astroEl.style.top = `${newAstroConfig.position[1]}%`;
    containerEl.appendChild(astroEl);

    const clientRect = astroEl.getBoundingClientRect();

    return {
      el: astroEl,
      center: {
        x: clientRect.left + clientRect.width / 2,
        y: clientRect.top + clientRect.height / 2,
      },
      ...newAstroConfig,
    };
  });

  onUpdateElementSizes();
};

// UTILS
function polar2cartesian({ distance, angle }) {
  return {
    x: distance * Math.cos(angle),
    y: distance * Math.sin(angle),
  };
}

function cartesian2polar({ x, y }) {
  return {
    distance: Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)),
    angle: Math.atan2(y, x),
  };
}

const SHORT_RANGE = 0;
const LONG_RANGE = 320;

function calculateNewCursorPosition(cursor, objects) {
  let newCursor = { ...cursor };

  for (const object of objects) {
    const polar = cartesian2polar({
      x: cursor.x - object.center.x,
      y: cursor.y - object.center.y,
    });

    let intensity = 0;
    if (polar.distance < SHORT_RANGE) {
      intensity = 1;
    } else if (polar.distance > SHORT_RANGE + LONG_RANGE) {
      intensity = 0;
    } else {
      intensity = 1 - (polar.distance - SHORT_RANGE) / LONG_RANGE;
    }

    let newDistance = 0;
    if (object.behavior === 'REPEL') {
      newDistance = polar.distance + intensity * -40;
    }
    if (object.behavior === 'ATTRACT') {
      newDistance =
        polar.distance * (1 - intensity) + polar.distance * 1.5 * intensity;
    }

    const modifiedCartesian = polar2cartesian({
      angle: polar.angle,
      distance: newDistance,
    });
    const paddedModifiedCartesian = {
      x: cursor.x - modifiedCartesian.x - object.center.x,
      y: cursor.y - modifiedCartesian.y - object.center.y,
    };

    newCursor = {
      x: newCursor.x + paddedModifiedCartesian.x,
      y: newCursor.y + paddedModifiedCartesian.y,
    };
  }
  return newCursor;
}

// iterate over the elements to see if we need to hover anyone
function calculateHover(newCursor) {
  let someHovering = false;
  global.hoverTrackedElements.forEach((trackedObj) => {
    let isHovering = false;

    if (
      trackedObj.rect.x < newCursor.x &&
      trackedObj.rect.x + trackedObj.rect.width > newCursor.x &&
      trackedObj.rect.y < newCursor.y &&
      trackedObj.rect.y + trackedObj.rect.height > newCursor.y
    ) {
      isHovering = true;
    }

    if (isHovering === true) {
      trackedObj.el.classList.add('-hover');
    } else if (someHovering === false) {
      trackedObj.el.classList.remove('-hover');
    }

    someHovering = someHovering || isHovering;
  });

  if (someHovering === true) {
    setCursor(global.cursorInfo.pointer);
  } else if (someHovering === false) {
    setCursor(global.cursorInfo.normal);
  }
}

// remove the fake cursor when the user moves the real out of the window
function onMouseOut() {
  cursorEl.style.opacity = 0;
  global.isMouseVisible = false;
}

// main function that calculates the fake cursor position
function onMouseMove(evt) {
  global.mouseX = evt.clientX;
  global.mouseY = evt.clientY;
}

function onClick(evt) {
  if (!evt.isTrusted) return;

  const clickedEl = document.querySelector('.-hover');

  if (!clickedEl) return;

  clickedEl.click();
}

function onUpdateElementSizes() {
  global.hoverTrackedElements = [
    ...document.querySelectorAll('.-prevent-custom-cursor'),
  ].map((el) => {
    return {
      el,
      rect: el.getBoundingClientRect(),
    };
  });

  global.trackedAstros = global.trackedAstros.map((astro) => {
    const clientRect = astro.el.getBoundingClientRect();

    return {
      ...astro,
      center: {
        x: clientRect.left + clientRect.width / 2,
        y: clientRect.top + clientRect.height / 2,
      },
    };
  });
}

window.addEventListener('click', onClick);
window.addEventListener('resize', onUpdateElementSizes);
window.addEventListener('mouseout', onMouseOut);
window.addEventListener('contextmenu', (event) => event.preventDefault());
window.addEventListener('mousemove', onMouseMove);

// RENDER
function render() {
  if (global.isMouseVisible === false) {
    cursorEl.style.opacity = 1;
    global.isMouseVisible = true;
  }

  const calculatedCursor = calculateNewCursorPosition(
    {
      x: global.mouseX,
      y: global.mouseY,
    },
    global.trackedAstros
  );

  calculateHover(calculatedCursor);

  cursorEl.style.transform =
    'translatex(' +
    calculatedCursor.x +
    'px) translatey(' +
    calculatedCursor.y +
    'px)';

  window.requestAnimationFrame(render);
}
render();

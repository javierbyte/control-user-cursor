// config

const kAssets = {
  mac_retina: {
    normal: {
      src: 'assets/mac_retina.png',
      height: '22px',
      width: '15px'
    },
    pointer: {
      src: 'assets/mac_pointer_retina.png',
      width: '18.5px',
      height: '19.5px'
    }
  },
  mac: {
    normal: {
      src: 'assets/mac.png',
      width: '15px',
      height: '22px'
    },
    pointer: {
      src: 'assets/mac_pointer.png',
      width: '18px',
      height: '19px'
    }
  },
  other: {
    normal: {
      src: 'assets/other.png',
      width: '17px',
      height: '23px'
    },
    pointer: {
      src: 'assets/other_pointer.png',
      width: '22px',
      height: '26px'
    }
  }
};

function getCursor() {
  let navigator = window.navigator.platform.indexOf('Mac') > -1 ? 'mac' : 'win';

  if (window.devicePixelRatio > 1) {
    navigator += '_retina';
  }

  if (Object.keys(kAssets).includes(navigator)) {
    return kAssets[navigator];
  }

  return kAssets.other;
}

function setCursor(cursorConfig) {
  C.el.src = cursorConfig.src;
  C.el.style.width = cursorConfig.width;
  C.el.style.height = cursorConfig.height;
}

// global
window.C = {};

C.containerEl = document.querySelector('#container');
C.el = document.createElement('img');
C.el.id = 'cursor';

C.cursorConfig = getCursor();
setCursor(C.cursorConfig.normal);

document.body.appendChild(C.el);

C.elToTrack = {};
C.elToTrackKeys = Object.keys(C.elToTrack);

C.isMouseVisible = false;

function ControlUserCursor(config, createElements) {
  const elConfig = config.el;

  C.expoWeight = config.expoWeight || 2;

  if (createElements) {
    C.containerEl.innerHTML = '';
  }

  C.elToTrack = elConfig;

  C.elToTrackKeys = Object.keys(C.elToTrack);
  C.elToTrackKeys.map(key => {
    if (elConfig[key].el === undefined) {
      C.elToTrack[key].el = document.createElement('div');
      C.elToTrack[key].el.className = elConfig[key].className.join(' ');
      C.elToTrack[key].el.innerHTML = elConfig[key].innerHTML;
    }
    C.elToTrack[key]._hover = false;

    if (createElements) {
      C.containerEl.appendChild(C.elToTrack[key].el);
    }
  });

  onUpdateElementSizes();
}

// UTILS
function getPolarity(num) {
  return num >= 0 ? 1 : -1;
}

function getDiff(obj1, obj2) {
  const diffX = obj1.x - obj2.x;
  const diffY = obj1.y - obj2.y;
  return Math.sqrt(diffX * diffX + diffY * diffY);
}

// does the math, using the elToTrack config object
function calculateNewCursor(newCursor) {
  const calculatedCursor = {
    x: newCursor.x,
    y: newCursor.y
  };

  C.elToTrackKeys.map(key => {
    const objSize = C.elToTrack[key]._size;
    const objCenter = C.elToTrack[key]._center;
    const objBehavior = C.elToTrack[key].behavior;

    const diff = getDiff(objCenter, newCursor);

    const importance = Math.pow(1 - Math.min(1, Math.max(diff / C.wZ, 0)), C.expoWeight);

    if (importance < 0.001) {
      return newCursor;
    }

    let xyDiff;

    if (objBehavior === 'REPEL') {
      const angle = Math.atan2(objCenter.y - newCursor.y, objCenter.x - newCursor.x);
      const offset = objSize * importance / 1.4142;

      xyDiff = {
        x: Math.cos(angle) * (diff + offset),
        y: Math.sin(angle) * (diff + offset)
      };
    } else if (objBehavior === 'ATTRACT') {
      xyDiff = {
        x: objCenter.x - (objCenter.x * importance + newCursor.x * (1 - importance)),
        y: objCenter.y - (objCenter.y * importance + newCursor.y * (1 - importance))
      };
    }

    calculatedCursor.x = calculatedCursor.x - newCursor.x + (objCenter.x - xyDiff.x);
    calculatedCursor.y = calculatedCursor.y - newCursor.y + (objCenter.y - xyDiff.y);
  });

  return {
    x: Math.round(calculatedCursor.x),
    y: Math.round(calculatedCursor.y)
  };
}

// iterate over the elements to see if we need to hover anyone
function calculateHover(newCursor) {
  C.elToTrackKeys.map(key => {
    const trackedObj = C.elToTrack[key];

    if (trackedObj.behavior !== 'ATTRACT') {
      return;
    }

    const calculatedDiff = getDiff(trackedObj._center, newCursor);

    const isHovering = calculatedDiff < trackedObj._size / 2;

    if (isHovering === true && trackedObj._hover === false) {
      setCursor(C.cursorConfig.pointer);

      trackedObj._hover = true;
      trackedObj.el.classList.add('-hover');
    } else if (isHovering === false && trackedObj._hover === true) {
      setCursor(C.cursorConfig.normal);

      trackedObj._hover = false;
      trackedObj.el.classList.remove('-hover');
    }
  });
}

// remove the fake cursor when the user moves the real out of the window
function onMouseOut() {
  window.requestAnimationFrame(() => {
    C.el.style.opacity = 0;
    C.isMouseVisible = false;
  });
}

// main function that calculates the fake cursor position
function onMouseMove(evt) {
  window.requestAnimationFrame(() => {
    if (C.isMouseVisible === false) {
      C.el.style.opacity = 1;
      C.isMouseVisible = true;
    }

    const calculatedCursor = calculateNewCursor({
      x: evt.clientX,
      y: evt.clientY
    });

    calculateHover(calculatedCursor);

    C.el.style.transform =
      'translatex(' + calculatedCursor.x + 'px) translatey(' + calculatedCursor.y + 'px)';
  });
}

function onClick() {
  const clickedEl = document.querySelector('.-hover');

  if (!clickedEl) return;

  clickedEl.innerHTML = clickedEl.innerHTML === ':D' ? 'GRAVITY!' : ':D';
}

function onUpdateElementSizes() {
  window.requestAnimationFrame(() => {
    // update the window size values
    C.wX = window.innerWidth;
    C.wY = window.innerHeight;
    C.wZ = Math.min(C.wX, C.wY) / 2;

    // iterate over all the elements that we are tracking, and update the clientRect value
    C.elToTrackKeys.map(key => {
      const clientRect = C.elToTrack[key].el.getBoundingClientRect();

      // update element internal vals
      C.elToTrack[key]._clientRect = clientRect;
      C.elToTrack[key]._center = {
        x: clientRect.left + clientRect.width / 2,
        y: clientRect.top + clientRect.height / 2
      };
      C.elToTrack[key]._size = Math.max(clientRect.width, clientRect.height);
    });
  });
}

window.addEventListener('click', onClick);
window.addEventListener('resize', onUpdateElementSizes);
window.addEventListener('mouseout', onMouseOut);
window.addEventListener('contextmenu', event => event.preventDefault());

Array.from(document.querySelectorAll('.-prevent-custom-cursor')).forEach(link => {
  link.addEventListener('mouseover', evt => {
    setCursor(C.cursorConfig.pointer);
  });
  link.addEventListener('mouseleave', evt => {
    setCursor(C.cursorConfig.normal);
  });
});

// initialize sizes

const kConfig = {
  basic: {
    el: {
      buttonToPrevent: {
        behavior: 'REPEL',
        innerHTML: 'Nope :P',
        className: ['clickme', '-nope']
      }
    },
    expoWeight: 1
  },
  doble: {
    el: {
      buttonToPrevent: {
        behavior: 'REPEL',
        innerHTML: 'Nope :P',
        className: ['clickme', '-nope', '-alt1']
      },
      buttonToPrevent2: {
        behavior: 'REPEL',
        innerHTML: 'Nope :P',
        className: ['clickme', '-nope', '-alt2']
      }
    },
    expoWeight: 2
  },
  attract: {
    el: {
      buttonToAttract: {
        behavior: 'ATTRACT',
        innerHTML: 'Gravity!',
        className: ['clickme']
      }
    },
    expoWeight: 2
  },
  combined: {
    el: {
      buttonToPrevent: {
        behavior: 'REPEL',
        innerHTML: 'Nope :P',
        className: ['clickme', '-nope', '-alt1']
      },
      buttonToAttract: {
        behavior: 'ATTRACT',
        innerHTML: 'Gravity!',
        className: ['clickme', '-alt2']
      }
    },
    expoWeight: 2
  }
};

ControlUserCursor(kConfig.basic, true);
window.addEventListener('mousemove', onMouseMove);

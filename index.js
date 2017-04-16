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
const C = {};

C.containerEl = document.querySelector('#container');
C.el = document.createElement('img');
C.el.id = 'cursor';

C.cursorConfig = getCursor();
setCursor(C.cursorConfig.normal);

document.body.appendChild(C.el);

C.elToTrack = {};
C.elToTrackKeys = Object.keys(C.elToTrack);

C.isMouseVisible = false;

function setup(config) {
  const elConfig = config.el;

  C.expoWeight = config.expoWeight;

  C.containerEl.innerHTML = '';

  C.elToTrack = elConfig;

  C.elToTrackKeys = Object.keys(C.elToTrack);
  C.elToTrackKeys.map(key => {
    C.elToTrack[key].el = document.createElement('div');
    C.elToTrack[key].el.className = elConfig[key].className.join(' ');
    C.elToTrack[key].el.innerHTML = elConfig[key].innerHTML;
    C.elToTrack[key]._hover = false;

    C.containerEl.appendChild(C.elToTrack[key].el);
  });

  onUpdateElementSizes();
}

// UTILS
function getPolarity(num) {
  return num >= 0 ? 1 : -1;
}

function diffAndAngleToXY(diff, angle, offset) {
  const realOffset = offset > 4 ? Math.max(offset, 0) : 0;

  return {
    x: Math.round(Math.cos(angle) * (diff + realOffset)),
    y: Math.round(Math.sin(angle) * (diff + realOffset))
  };
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

    let xyDiff;

    if (objBehavior === 'REPEL') {
      const angle = Math.atan2(objCenter.y - newCursor.y, objCenter.x - newCursor.x);

      xyDiff = diffAndAngleToXY(diff, angle, objSize * importance / 1.4142);
    } else {
      xyDiff = {
        x: objCenter.x - (objCenter.x * importance + newCursor.x * (1 - importance)),
        y: objCenter.y - (objCenter.y * importance + newCursor.y * (1 - importance))
      };
    }

    calculatedCursor.x = calculatedCursor.x - newCursor.x + Math.round(objCenter.x - xyDiff.x);
    calculatedCursor.y = calculatedCursor.y - newCursor.y + Math.round(objCenter.y - xyDiff.y);
  });

  return calculatedCursor;
}

// iterate over the elements to see if we we need to hover anyone
function calculateHover(newCursor) {
  C.elToTrackKeys.map(key => {
    const trackedObj = C.elToTrack[key];

    if (trackedObj.behavior !== 'ATRACT') {
      return;
    }

    const calculatedDiff = getDiff(trackedObj._center, newCursor);

    const isHovering = calculatedDiff < trackedObj._size / 2;

    if (isHovering && trackedObj._hover === false) {
      setCursor(C.cursorConfig.pointer);

      trackedObj._hover = true;
      trackedObj.el.classList.add('-hover');
    } else if (!isHovering && trackedObj._hover === true) {
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

    C.el.style.left = calculatedCursor.x + 'px';
    C.el.style.top = calculatedCursor.y + 'px';
  });
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
        x: Math.round(clientRect.left + clientRect.width / 2),
        y: Math.round(clientRect.top + clientRect.height / 2)
      };
      C.elToTrack[key]._size = Math.max(clientRect.width, clientRect.height);
    });
  });
}

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
    expoWeight: 0.8
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
  atract: {
    el: {
      buttonToAtract: {
        behavior: 'ATRACT',
        innerHTML: 'Gravity!',
        className: ['clickme']
      }
    },
    expoWeight: 2.2
  },
  combined: {
    el: {
      buttonToPrevent: {
        behavior: 'REPEL',
        innerHTML: 'Nope :P',
        className: ['clickme', '-nope', '-alt1']
      },
      buttonToAtract: {
        behavior: 'ATRACT',
        innerHTML: 'Gravity!',
        className: ['clickme', '-alt2']
      }
    },
    expoWeight: 2.2
  }
};

setup(kConfig.basic);
window.addEventListener('mousemove', onMouseMove);

Array.from(document.querySelectorAll('.options-element')).forEach(option => {
  console.log('adding listeners');

  option.addEventListener('click', () => {
    console.log('clickeooo');

    document.querySelector('.options-element.-active').classList.remove('-active');
    option.classList.add('-active');

    setup(kConfig[option.dataset.type]);
  });
});

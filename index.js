// global
const C = {};

C.el = document.querySelector('#cursor');
C.kElementsToTrack = {
  buttonToPrevent: {
    el: document.querySelector('#buttonToPrevent'),
    behavior: 'REPEL'
  }
};
C.isMouseVisible = false;

C.kElementsToTrackKeys = Object.keys(C.kElementsToTrack);

function getPolarity(num) {
  return num >= 0 ? 1 : -1;
}

function diffAndAngleToXY(diff, angle, offset) {
  return {
    x: Math.round(Math.cos(angle) * (diff + offset)),
    y: Math.round(Math.sin(angle) * (diff + offset))
  };
}

function calculateNewCursor(newCursor) {
  const calculatedCursor = {
    x: newCursor.x,
    y: newCursor.y
  };

  C.kElementsToTrackKeys.map(key => {
    const objSize = C.kElementsToTrack[key]._size;
    const objCenter = C.kElementsToTrack[key]._center;

    const diffX = objCenter.x - newCursor.x;
    const diffY = objCenter.y - newCursor.y;
    const diff = Math.sqrt(diffX * diffX + diffY * diffY);

    const angle = Math.atan2(objCenter.y - newCursor.y, objCenter.x - newCursor.x);

    const importance = Math.max(Math.pow(1 - diff / C.wZ, 2), 0);

    const xyDiff = diffAndAngleToXY(diff, angle, objSize * importance);

    calculatedCursor.x = Math.round(objCenter.x - xyDiff.x);
    calculatedCursor.y = Math.round(objCenter.y - xyDiff.y);
  });

  return calculatedCursor;
}

function onMouseOut() {
  window.requestAnimationFrame(() => {
    C.el.style.opacity = 0;
    C.isMouseVisible = false;
  });
}

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

    C.el.style.left = calculatedCursor.x + 'px';
    C.el.style.top = calculatedCursor.y + 'px';
  });
}

function onUpdateElementSizes() {
  window.requestAnimationFrame(() => {
    // update the window size values
    C.wX = window.innerWidth;
    C.wY = window.innerHeight;
    C.wZ = Math.max(C.wX, C.wY) / 2;

    // iterate over all the elements that we are tracking, and update the clientRect value
    C.kElementsToTrackKeys.map(key => {
      const clientRect = C.kElementsToTrack[key].el.getBoundingClientRect();

      // update element internal vals
      C.kElementsToTrack[key]._clientRect = clientRect;
      C.kElementsToTrack[key]._center = {
        x: Math.round(clientRect.left + clientRect.width / 2),
        y: Math.round(clientRect.top + clientRect.height / 2)
      };
      C.kElementsToTrack[key]._size = Math.max(clientRect.width, clientRect.height);
    });
  });
}

window.addEventListener('resize', onUpdateElementSizes);
window.addEventListener('mouseout', onMouseOut);
window.addEventListener('contextmenu', event => event.preventDefault());

// initialize sizes
onUpdateElementSizes();
window.addEventListener('mousemove', onMouseMove);

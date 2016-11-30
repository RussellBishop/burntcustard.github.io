/*jslint white: true, browser: true*/

/*global game: false, toggleDebug, pause, canvas*/



/***************/
/* TOUCH INPUT */
/***************/

function touchInput(event) {
  
  "use strict";
  
  event.preventDefault();
  
  game.screenTouch = {
    active: true,
    x: event.targetTouches[0].screenX,
    y: event.targetTouches[0].screenY
  };
  
  game.worldTouch = {
    active: true,
    x: event.targetTouches[0].pageX + game.camera.x,
    y: event.targetTouches[0].pageY + game.camera.y
  };
  
  //console.log("screenTouch: X: " + game.screenTouch.x.toFixed(1) + " Y: " + game.screenTouch.y.toFixed(1));
  //console.log("worldTouch:  X: " + game.worldTouch.x.toFixed(1) + " Y: " + game.worldTouch.y.toFixed(1));
  
}



function touchStop(event) {
  
  "use strict";
  
  event.preventDefault();
  
  game.screenTouch.active = false;
  game.worldTouch.active = false;
  
}





/******************/
/* KEYBOARD INPUT */
/******************/

document.onkeydown = function (key) {
  
  "use strict";
  
  //console.log(key.which); // Used to check key.which numbers.
  
  switch (key.which) {
    case  87: if (!(game.keys.indexOf('w') > -1)) game.keys.push('w'); break;
    case  65: if (!(game.keys.indexOf('a') > -1)) game.keys.push('a'); break;
    case  83: if (!(game.keys.indexOf('s') > -1)) game.keys.push('s'); break;
    case  68: if (!(game.keys.indexOf('d') > -1)) game.keys.push('d'); break;
    case  38: if (!(game.keys.indexOf('▲') > -1)) game.keys.push('▲'); break;
    case  37: if (!(game.keys.indexOf('◀') > -1)) game.keys.push('◀'); break;
    case  40: if (!(game.keys.indexOf('▼') > -1)) game.keys.push('▼'); break;
    case  39: if (!(game.keys.indexOf('▶') > -1)) game.keys.push('▶'); break;
    case  32: if (!(game.keys.indexOf('␣') > -1)) game.keys.push('␣'); break;
    case 191: toggleDebug('?'); break;
    case  19: pause('pause|break'); break;
    case  80: pause('p'); break;
  }
  
};



document.onkeyup = function (key) {
  
  "use strict";
  
  switch (key.which) {
    case  87: game.keys.splice(game.keys.indexOf('w'), 1); break;
    case  65: game.keys.splice(game.keys.indexOf('a'), 1); break;
    case  83: game.keys.splice(game.keys.indexOf('s'), 1); break;
    case  68: game.keys.splice(game.keys.indexOf('d'), 1); break;
    case  38: game.keys.splice(game.keys.indexOf('▲'), 1); break;
    case  37: game.keys.splice(game.keys.indexOf('◀'), 1); break;
    case  40: game.keys.splice(game.keys.indexOf('▼'), 1); break;
    case  39: game.keys.splice(game.keys.indexOf('▶'), 1); break;
    case 191: game.keys.splice(game.keys.indexOf('?'), 1); break;
    case  32: game.keys.splice(game.keys.indexOf('␣'), 1); break;
  }
  
};





/*global move*/
// = include('./vendor/async.0.9.0.js')
// = include('./vendor/move.0.3.3.js')

function $ (selector, el) {
  if (!el) { el = document; }
  return el.querySelector(selector);
}

function $_ (selector, el) {
  if (!el) { el = document; }
  return Array.prototype.slice.call(el.querySelectorAll(selector));
}

function getRandomRange(min, max) {
    return Math.random() * (max - min) + min;
}

// { element, content, speed, variance }
function type (opts, callback) {
  var char = opts.content.pop();
  var naturalSpeed = (char === ' ') ?
    getRandomRange(opts.speed - opts.variance, opts.speed + opts.variance) * 3 :
    getRandomRange(opts.speed - opts.variance, opts.speed + opts.variance);
  opts.element.value = opts.element.value + char;
  console.log(opts.element, opts.content, opts.speed, opts.variance);
  if (opts.content.length) {
    setTimeout(function () {
      type(opts, callback);
    }, naturalSpeed);
  } else {
    if (callback) { return callback(); }
  }
}

// move('.Demo-cursor--wand')
//   .duration('1s')
//   .x(20)
//   .then()
//     .duration('0s')
//     .set('opacity', 0)
//   .pop()
// .end();

// move('.Demo-cursor--wand-active')
//   .duration('1s')
//   .x(20)
//   .then()
//     .duration('0s')
//     .set('opacity', 1)
//   .pop()
// .end();

moveWandToTip();


function moveWandToTip () {
  move('.Demo-cursor--wand')
    .duration('1s')
    .x(20)
    .end(function (that) {
      that.el.classList.add('Demo-cursor--wand-active');
      move('.Media-username.kabosu')
        .delay('0s')
        .duration('0s')
        .set('color', 'purple')
        .end(showTipModal);
    });
}


function clickInput () {
  move('.btn-primary .Demo-cursor--normal')
    .duration('1s')
    .x(0)
    .y(20)
    .end(function (that) {
      that.el.classList.add('Demo-cursor--normal-active');
      move('.Media-username.kabosu')
        .delay('0s')
        .duration('0s')
        .set('color', 'purple')
        .end(showTipModal);
    });
}


function showTipModal () {
  async.parallel(
    [
      function (cb) {
        move('.Demo-modal-backdrop')
          .delay('1.2s')
          .duration('0.2s')
          .set('opacity', 0.5)
          .end(cb);
      },
      function (cb) {
        move('.Demo-tip-modal')
          .delay('1.2s')
          .duration('0.2s')
          .set('opacity', 1)
          .end(cb);
      }
    ],

    typeAmount
  );
}


function typeAmount () {
  $('.Demo-tip-modal input').classList.add('focus');
  type({
    element: $('.Demo-tip-modal input'),
    content: '3000'.split('').reverse(),
    speed: 160,
    variance: 30
  }, hideTipModal);
}


function hideTipModal () {
  move('.Demo-tip-modal')
    .delay('2s')
    .duration('0.001s')
    .set('opacity', 0)
    .end(showConfModal);
}


function showConfModal () {
  $('.Demo-conf-modal textarea').focus();
  move('.Demo-conf-modal')
    .delay('0s')
    .duration('0.001s')
    .set('opacity', 1)
    .then()
      .delay('3s')
      .duration('0s')
      .set('opacity', 1)
      .pop()
    .end(typeMessage);
}

// function hideConfModal () {
//   move('.Demo-conf-modal')
//     .delay('3s')
//     .duration('0.001s')
//     .set('opacity', 1)
//     .end(typeMessage);
// }

function typeMessage () {
  type({
    element: $('.Media-body textarea'),
    content: 'Wow. Such beautiful. So cry right now. Have coin:'.split('').reverse(),
    speed: 160,
    variance: 30
  }, pasteLink);
}

// move('.Media-username.kabosu')
//   .delay('1s')
//   .duration('0s')
//   .set('color', 'purple')
// .end();

// move('.Demo-tip-modal')
//   .delay('1.2s')
//   .duration('0s')
//   .set('opacity', 1)
// .end();

// move('.Demo-modal-backdrop')
//   .delay('1.2s')
//   .duration('0.2s')
//   .set('opacity', 0.5)
// .end(function () {
  // $('.Demo-tip-modal input').classList.add('focus');
  // type({
  //   element: $('.Demo-tip-modal input'),
  //   content: '3000'.split('').reverse(),
  //   speed: 160,
  //   variance: 30
  // }, clickModalBtn);
// });

// function clickModalBtn () {
//   move('.Demo-cursor--normal')
//     .duration('1s')
//     .x(100)
//     .end(function (that) {
//       that.el.classList.add('Demo-cursor--normal-active');
//       that.el.classList.remove('Demo-cursor--normal');
//       move('.Demo-tip-modal-button')
//         .delay('1.2s')
//         .end(function (that) {
//           console.log(that)
//           that.el.classList.add('active');
//         });
//     });
// }







// move('#example-13 .box2')
//   .set('background-color', 'red')
//   .x(50)
//   .rotate(60)
//     .then()
//       .rotate(30)
//       .scale(1.5)
//       .then()
//         .set('opacity', 0)
//       .pop()
//     .pop()
// .end();
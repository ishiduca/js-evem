! function (BASIC_TEST) {
    var modulePath = {
        baseUrl: '../'
      , file: 'index'
    };

// AMD - RequireJS
    if ('function' === typeof define &&
        'function' === typeof requirejs
    ) {

        requirejs.config({
            baseUrl: modulePath.baseUrl
        });
        requirejs([ modulePath.file ], function (events) {
            QUnit.start();
            BASIC_TEST(events, {QUnit: QUnit});
        });

    } else

// CommonJS - node.js
    if ('undefined' !== typeof module &&
        module.exports &&
        'function' === typeof require
    ) {

        (function () {
            var path  = require('path');
            var QUnit = require(path.join(
                          __dirname, './qunit/helper'
                      )).QUnit;

            var events = require(path.join(
                          __dirname
                        , modulePath.baseUrl
                        , modulePath.file
                      ));

          BASIC_TEST(events, {QUnit: QUnit});
       })();

    }

// this === window
    else {

        (function (g) {
            BASIC_TEST(g.events, {QUnit: QUnit})
        })(this);

    }

}(
// テスト本体
function BASIC_TEST (ev, opt) {

    var is = opt.QUnit.strictEqual;
    var module = opt.QUnit.module;


    module('load test');
    test('load ev', function () {
        ok(ev, 'exists "ev"');
        is( typeof ev.EventEmitter, 'function', 'ev.EventEmitter is constructor');
    });

    module('methods - removeListener, once, on');
    test('on(event, listener)', function () {
        var hoge = new ev.EventEmitter;
        ok(hoge, 'ok - new ev.EventEmitter');

        throws(
            function () { hoge.on() }
          , /1st.+string/
          , '1st argument must be "string"'
        );
        throws(
            function () { hoge.on('foo') }
          , /2nd.+function/
          , '2nd argument must be "function"'
        );

        stop();
        var f = function () {}, c = 0;
        hoge.on('newListener', function (ev, listener) {
            switch (c++) {
                case 0 :
                    is(ev, 'newListener');
                    break;
                case 1 :
                    is(ev, 'hoge');
                    is(listener, f);
                    start();
                    break;
            }
        });

        is(hoge.on('hoge', f), hoge
          , 'hoge = hoge.on("event", callback)'
        );
    });
    test('removeListener(event, listener)', function () {
        var hoge = new ev.EventEmitter();
        var f = function f () {};

        stop();
        hoge.on('removeTest', f);

        hoge.on('removeListener', function onRemoveListener (ev, listener) {
            is(ev, 'removeTest');
            is(listener, f);
            start();
        });

        is( hoge.removeListener('removeTest', f), f
          , 'cb = hoge.removeListener("removeTest", cb)');
        is( hoge.removeListener('removeTest', f), null
          , 'null = hoge.removeListener("removeTest", cb) : after removed cb');

    });
    test('listeners(ev)', function () {
        var hoge = new ev.EventEmitter;
        var f  = function () {};
        var f2 = function () {};
        var cases = ('case1 case2 case3').split(' ');

        cases.forEach(function (ev) {
            hoge.on(ev, f).on(ev, f2);
        });

        throws(
            function () { hoge.listeners() }
          , /1st.+string/
          , 'event not found'
        );

        cases.forEach(function (ev) {
            deepEqual(hoge.listeners(ev), [f, f2]);
        });

        is(hoge.listeners('noRegisterEvent'), null);
    });
    test('removeAllListeners()', function () {
        var hoge = new ev.EventEmitter;
        var f  = function () {};
        var f2 = function () {};
        var cases = ('case1 case2 case3').split(' ');

        cases.forEach(function (ev) {
            hoge.on(ev, f).on(ev, f2);
        });

        hoge.removeAllListeners('case1');
        deepEqual( hoge.listeners('case1'), null);
        deepEqual( hoge.listeners('case2'), [ f, f2 ]);
        deepEqual( hoge.listeners('case3'), [ f, f2 ]);

        hoge.removeAllListeners('case3');
        deepEqual( hoge.listeners('case1'), null);
        deepEqual( hoge.listeners('case2'), [ f, f2 ]);
        deepEqual( hoge.listeners('case3'), null);

        hoge.removeAllListeners();
        deepEqual( hoge.evs, {});

    });
    test('on(event, cb) && emit(event, a, b, c)', function () {
        var hoge = new ev.EventEmitter();
        var count = 3;

        hoge.on('timeup', function _onTimeUp (n, nn, nnn) {
            switch (n) {
                case 0 : deepEqual([n, nn, nnn], [0, 1, 2]); break;
                case 1 : deepEqual([n, nn, nnn], [1, 2, 3]); break;
                case 2 : deepEqual([n, nn, nnn], [2, 3, 4]); break;
            }
            if (n === 2) start();
        });


        stop();
        for (var i = 0; i < count; i++) {
            hoge.emit('timeup', i, i+1, i+2);
        }
    });
    test('once(event, cb) && emit(event, a, b, c)', function () {
        var hoge = new ev.EventEmitter();
        var count = 3;

        hoge.once('timeup', function _onTimeUp (n, nn, nnn) {
            deepEqual([n, nn, nnn], [ 0, 1, 2 ]);
        });

        for (var i = 0; i < count; i++) {
            hoge.emit('timeup', i, i+1, i+2);
        }
    });
    test('emit(event, args)', function () {
        var hoge = new ev.EventEmitter();
        var count = 0;

        hoge.once('timeup', function _onTimeUp (n, nn, nnn) {
            is(n, 3);
            is(nn, 2);
            is(nnn, 1);
        })
        .on('timeup', function (n, nn, nnn) {
            count++;
            if (count === 1) {
                is(n, 3);
                is(nn, 2);
                is(nnn, 1);
            }
            if (count === 2) {
                is(n, 4);
                is(nn, 5);
                is(nnn, 6);

                is(hoge.evs.timeup.length, 1);

                start();
            }
        });

        setTimeout(function () { hoge.emit('timeup', 3, 2, 1); }, 0);
        setTimeout(function () { hoge.emit('timeup', 4, 5, 6); }, 0);
        stop();
    });

    module('inherits', {
        setup: function () {
            var Timer = this.Timer = function (sec) {
                this.seconds(sec);

                var that = this;
                this.on('close', function () {
                    that.emit('end');
                });
            };
            (function (tp) {
                tp.seconds = function (sec) {
                    if (typeof sec === 'undefined' || sec === null) return this.sec;

                    var errmes = '"sec" must be "number" and over 0';
                    if (typeof sec !== 'number' || sec !== parseInt(sec))
                        throw new TypeError(errmes);
                    if (sec < 0) throw new RangeError(errmes);

                    this.sec = sec;

                    return this;
                };
                tp.start = function () {
                    var that = this;
                    var countdown = function () {
                        if (that.sec < 0) return that.close();

                        that.emit('data', that.sec.toString());

                        --that.sec;
                    };
                    this.intervalID = setInterval(countdown, 1000);
                    countdown();
                };
                tp.pause = function () {
                    if (this.intervalID) {
                        clearInterval(this.intervalID);
                        delete this.intervalID;
                    }
                    return this;
                };
                tp.close = function () {
                    this.pause();
                    delete this.sec;
                    this.emit('close');
                    return this;
                };
            })(Timer.prototype = new ev.EventEmitter);
        }
    });
    test('prototype pollution', function () {
        var timer  = new this.Timer(10);
        var timer2 = new this.Timer(11);
        var p  = timer .constructor.prototype;
        var p2 = timer2.constructor.prototype;

        var onData = function (n) { return Number(n); }
        var onEnd  = function () { return 'end'; };

        ok(timer);
        ok(timer2);

        is(timer .seconds(), 10);
        is(timer2.seconds(), 11);

        is(p, p2, 'timer と timer2 のプロトタイプオブジェクトは同じオブジェクト');

        timer.on('data', onData);
        timer.once('end', onEnd);

        deepEqual( timer.listeners('data'), [ onData ]);
        deepEqual( timer.listeners('end'), [ onEnd ]);

        deepEqual( timer2.listeners('data'), null);
        deepEqual( timer2.listeners('end'), null);

        deepEqual( p.listeners('data'), null);
        deepEqual( p.listeners('end'), null);

    });

}
);



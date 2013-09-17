(function (global) {
    'use strict'

    var isBrowser = !! global.self
    var isWorker  = !! global.WorkerLocation
    var isNodeJS  = !! global.global

    var path, QUnit, EventEmitter, util, Em
    if (isNodeJS) {
        path  = require('path')
        util  = require('util')
        QUnit = require(path.join( __dirname, './qunit/driver')).QUnit
        EventEmitter = require(path.join( __dirname, '../index')).EventEmitter

        unitTest(QUnit, EventEmitter)

        Em = function () { EventEmitter.call(this) }
        util.inherits(Em, EventEmitter)

        unitTest(QUnit, Em)
    } else {
        unitTest(global.QUnit, global.EventEmitter)

        Em = function () { global.EventEmitter.call(this) }
        Em.prototype = function () {
            var F = function () {}
            F.prototype = global.EventEmitter.prototype
            return new F
        }()

        unitTest(global.QUnit, Em)
    }


    function unitTest (QUnit, Emitter) {
        var is = QUnit.strictEqual

        QUnit.module('new Emitter')
        test('returns event emitter',function () {
            var emitter = new Emitter

            ok(emitter instanceof Emitter)
            is(typeof emitter.on, 'function')
            is(typeof emitter.emit, 'function')
        })

        QUnit.module('.on')
        asyncTest('リスナーが登録された時 emit("newListener", listener) される'
        , function () {
            var emitter = new Emitter
            var listener = function () {}
            emitter.on('newListener', function (_listener) {
                ok(true)
                is(listener, _listener)
                start()
            })
            emitter.on('hoge', listener)
        })
        test('リスナーが関数でない場合、TypeErrorを投げる', function () {
            var emitter = new Emitter
            throws(function () { emitter.on('notFunctionalLister', {}) }
              , TypeError
            )
        })
        test('emitter自身を返す', function () {
            var emitter = new Emitter
            is(emitter.on('hoge', function () {}), emitter)
        })
        asyncTest('emit("hoge")された回数、リスナーを実行する', function () {
            var emitter = new Emitter
            var c = 0
            emitter.on('event', function () {
                if ((c += 1) === 3) {
                    ok(true)
                    start()
                }
            })

            emitter.emit('event')
            emitter.emit('no_register_event')
            emitter.emit('event')
            emitter.emit('event')
        })
        asyncTest('emit("hoge", data)された順番に、リスナーを実行する', function () {
            var emitter = new Emitter
            var c = 0
            emitter.on('event', function (data) {
                is((c += 1), data)
                if (c === 3) start()
            })

            emitter.emit('event', 1)
            emitter.emit('event', 2)
            emitter.emit('event', 3)
        })

        QUnit.module('.emit')
        asyncTest('複数のデータをemitして、リスナーに渡す', function () {
            var emitter = new Emitter
            var buf = []
            var done = function () {
                deepEqual(buf, [[1, 2, 3], ['hage', 'debu', undefined]])
                start()
            }
            emitter.on('event', function (a, b, c) {
                buf.push([ a, b, c ])
                if (buf.length === 2) done()
            })

            emitter.emit('event', 1, 2, 3)
            emitter.emit('event', 'hage', 'debu')
        })
        asyncTest('不特定の複数のデータをemitして、リスナーに渡す', function () {
            var emitter = new Emitter
            var buf = []
            var done = function () {
                deepEqual(buf, [[1, 2, 3], ['hage', 'debu']])
                start()
            }
            emitter.on('event', function () {
                buf.push([].slice.apply(arguments))
                if (buf.length === 2) done()
            })

            emitter.emit('event', 1, 2, 3)
            emitter.emit('event', 'hage', 'debu')
        })
        test('リスナーがないときには false を返し、リスナーがあるときには true を返す'
        , function () {
            var emitter = new Emitter

            is(emitter.emit('event'), false)
            emitter.on('event', function () {})
            is(emitter.emit('event'), true)
        })
        asyncTest('calls all listeners', function () {
            var emitter = new Emitter
            var buf = []
            var res = [
                {name: 1, count: 1, data: 'abc'}
              , {name: 2, count: 1, data: 'abc'}
              , {name: 1, count: 2, data: 'ABC'}
              , {name: 2, count: 2, data: 'ABC'}
            ]
            var listeners = [1,2].map(function (dum) {
                var c = 0
                return function (x,y,z) {
                    buf.push({name: dum, count: (c += 1), data: [x,y,z].join('')})

                    if (c === 2 && dum === 2) done()
                }
            })
            var done = function () {
                deepEqual( buf, res )
                start()
            }

            emitter.on('event', listeners[0])
            emitter.on('event', listeners[1])

            emitter.emit('event', 'a', 'b', 'c')
            emitter.emit('event', 'A', 'B', 'C')
        })

        QUnit.module('.once')
        test('emitter自身を返す', function () {
            var emitter = new Emitter
            is(emitter.once('hoge', function () {}), emitter)
        })
        asyncTest('once(listener)されたlistenerは実行した時に' +
             'emit("removeListener", listener)される', function () {
            var emitter  = new Emitter
            var listener = function () {}
            emitter.on('removeListener', function (_listener) {
                is(_listener, listener)
                start()
            })
            .once('event', listener)

            emitter.emit('event')
        })
        asyncTest('once(listener)されたlistenerは一度しか実行できない', function () {
            var emitter = new Emitter
            var buf = []
            var res = [
                {name: 1, count: 1, data: 'abc'}
              , {name: 2, count: 1, data: 'abc'}
              , {name: 3, count: 1, data: 'abc'}
              , {name: 2, count: 2, data: 'ABC'}
            ]
            var listeners = [1,2,3].map(function (dum) {
                var c = 0
                return function (x, y, z) {
                    buf.push({name: dum, count: (c += 1), data: [x,y,z].join('')})
                    if (c === 2) done()
                }
            })
            var done = function () {
                deepEqual( buf, res )
                start()
            }

            emitter.once('event', listeners[0])
            emitter.on(  'event', listeners[1])
            emitter.once('event', listeners[2])

            emitter.emit('event', 'a', 'b', 'c')
            emitter.emit('event', 'A', 'B', 'C')
        })

        QUnit.module('.listeners')
        test('リスナー未登録時点で listener は 空の配列を返す', function () {
            var emitter = new Emitter
            deepEqual(emitter.listeners('event'), [])
        })
        test('リスナーの登録状態で .listener の返すリスナー数は増減する', function () {
            var emitter = new Emitter
            var listeners = [1, 2, 3].map(function (dum) {
                return function () { return dum }
            })

            listeners.forEach(function (listener, n) {
                n === 1 ? emitter.once('event', listener)
                        : emitter.on(  'event', listener)
            })

            deepEqual(emitter.listeners('event'), listeners)

            emitter.emit('event')

            deepEqual(emitter.listeners('event'), [ listeners[0], listeners[2] ])
        })

        QUnit.module('.removeListener')
        asyncTest('リスナーをremoveListenerすると' +
            '"removeListener"イベントを発生し、リムーブしたリスナーを返す', function () {
            var emitter = new Emitter
            var listener = function () {}
            emitter.on('removeListener', function (_listener) {
                is(listener, _listener)
                start()
            })
            emitter.on('event', listener)
            emitter.removeListener('event', listener)
        })
        asyncTest('リスナーをremoveListenerすると' +
            '"removeListener"イベントを発生し、リムーブしたリスナーを返す（複数）', function () {
            var emitter = new Emitter
            var listener = function () {}
            var c = 0
            emitter.on('removeListener', function (_listener) {
                is(listener, _listener)
                if ((c += 1) === 3) start()
            })

            emitter.on('event', listener)
            emitter.on('event', listener)
            emitter.on('event', listener)

            emitter.removeListener('event', listener)
        })
    }

})(this.self || global)

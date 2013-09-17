(function (global) {
    'use strict'

    var isBrowser = !! global.self
    var isWorker  = !! global.WorkerLocation
    var isNodeJS  = !! global.global

    var path, QUnit, EventEmitter
    if (isNodeJS) {
        path  = require('path')
        QUnit = require(path.join( __dirname, './qunit/driver')).QUnit
        EventEmitter = require(path.join( __dirname, '../index')).EventEmitter
    } else {
        QUnit = global.QUnit
        EventEmitter = global.EventEmitter
    }

    QUnit.module('モジュールの読み込み')
    test('"QUnit" の読み込み', function () { ok(QUnit.strictEqual) })
    test('"EventEmitter" の読み込み', function () { ok(EventEmitter) })

})(this.self || global)

(function (global) {
    'use strict'

    var isBrowser = !! global.self
    var isWorker  = !! global.WorkerLocation
    var isNodeJS  = !! global.global

    function EventEmitter () {
        this.events = {}
        this.onceEvents = {}
        return this
    }

    var EP = EventEmitter.prototype

    EP._push = function (ev, listener, isOnce) {
        if (typeof ev !== 'string')
            throw new TypeError('"event" must be "string"')
        if (typeof listener !== 'function')
            throw new TypeError('"listener" must be "function"')

        this.emit('newListener', listener)

        this.events     || (this.events = {})
        this.events[ev] || (this.events[ev] = [])
        this.events[ev].push(listener)

        if (! isOnce) return

        this.onceEvents || (this.onceEvents = {})
        this.onceEvents[ev] || (this.onceEvents[ev] = [])
        this.onceEvents[ev].push(this.events[ev].length - 1)
    }

    EP.on = EP.addListener = function (ev, listener) {
        this._push(ev, listener)
        return this
    }

    EP.once = function (ev, listener) {
        this._push(ev, listener, true)
        return this
    }

    EP.emit = function () {
        var args = [].slice.apply(arguments)
        var ev   = args.shift()
        var existsListener = false

        if (! this.events) return existsListener
        if (! this.events[ev]) return existsListener

        var i = 0, evs = this.events[ev], len = evs.length
          , listener, existsListener = 0
        ;for (; i < len; i++) {
            listener = evs[i]
            if (typeof listener === 'function') {
                listener.apply(this, args)
                existsListener = true
            }
        }

        if (this.onceEvents && this.onceEvents[ev]) {
            var i = 0, evs = this.onceEvents[ev], len = evs.length
              , rmindex, listener
            ;for (; i < len; i++) {
                rmindex = evs[i]
                listener = this.events[ev][rmindex]
                this.events[ev][rmindex] = null
                this.emit('removeListener', listener)
            }
        }

        return existsListener
    }

    EP.removeListener = function (ev, listener) {
        if (typeof ev !== 'string')
            throw new TypeError('"ev" must be "string"')
        if (typeof listener !== 'function')
            throw new TypeError('"listener" must be "function"')

        if (! this.events) return this
        if (! this.events[ev]) return this

        var i = 0, evs = this.events[ev], len = evs.length
          , _listener
        for (; i < len; i++) {
            _listener = evs[i]
            if (_listener === listener) {
                this.events[ev][i] = null
                this.emit('removeListener', listener)
            }
        }

        return this
    }

    EP.listeners = function (ev) {
        if (typeof ev !== 'string')
            throw new TypeError('"ev" must be "string"')

        var list = []

        if (! this.events) return list
        if (! this.events[ev]) return list

        var i = 0, evs = this.events[ev], len = evs.length
        for (; i < len; i++) {
            if (typeof evs[i] === 'function') list.push(evs[i])
        }

        return list
    }

    EP.removeAllListeners = function (ev) {
        if (! ev) {
            this.constructor()
            return this
        }

        if (this.events && this.events[ev]) this.events[ev] = []
        if (this.onceEvents && this.onceEvents[ev]) this.onceEvents = []

        return this
    }


    if (isNodeJS) {
        module.exports.EventEmitter = EventEmitter
    }
    else {
        global.EventEmitter = EventEmitter
    }

})(this.self || global)

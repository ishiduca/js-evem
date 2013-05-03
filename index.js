! function (define) {
    define([], function () {
        "use strict";

        function search (arry, cb) {
            var i = 0, len = arry.length;
            for (; i < len; i++) {
                if (cb(arry[i], i) === true) return [arry[i], i];
            }
            return null;
        }

        var events = {};
        events.EventEmitter = function () {};

        (function (ep) {
            var errors = function (arg, type) {
                var mes = {
                    "string": '1st argument(eventname) must be "string"'
                  , "function": '2nd argument(listener) must be "function"'
                };
                if (typeof arg !== type) throw new TypeError(mes[type]);
            };

            ep.emit = function (/*ev*/) {
                errors(arguments[0], 'string');
                var args = Array.prototype.slice.apply(arguments);
                var ev = args.shift();

                if (! this.evs || ! this.evs[ev]) return;

                var buffer = [];
                search(this.evs[ev], function (listener, i) {
                    if (listener.atOnce === true) {
                        buffer.push(listener);
                        delete listener.atOnce;
                    }
                    listener.apply(null, args);
                });

                var that = this;
                if (buffer.length) {
                    search(buffer, function (listener) {
                        that.removeListener(ev, listener);
                    });
                }

            };
            ep.on = ep.addListener = function (ev, listener) {
                errors(ev, 'string');
                errors(listener, 'function');

                if (! this.evs) this.evs = {};
                if (! this.evs[ev]) this.evs[ev] = [];

                this.evs[ev].push(listener);

                this.emit('newListener', ev, listener);

                return this;
            };
            ep.once = function (ev, listener) {
                listener.atOnce = true;
                this.on(ev, listener);

                return this;
            };
            ep.removeListener = function (ev, listener) {
                errors(ev, 'string');
                errors(listener, 'function');

                if (! this.evs || ! this.evs[ev]) return null;

                var index = search(this.evs[ev], function (_listener, i) {
                    return _listener === listener;
                });

                if (index === null) return null;

                var _listener = this.evs[ev].splice(index[1], 1)[0];

                this.emit('removeListener', ev, _listener);

                return _listener;
            };
            ep.removeAllListeners = function (ev) {
                if (typeof ev === 'string' && this.evs) delete this.evs[ev];
                if (ev === null || typeof ev === 'undefined') this.evs = {};
            };
            //ep.setMaxListeners = function (n) {};
            ep.listeners = function (ev) {
                errors(ev, 'string');

                return (this.evs && this.evs[ev]) ? this.evs[ev] : null;
            };
        })(events.EventEmitter.prototype);

        return events;
    });
}(
// AMD - RequireJS
    ('function' === typeof define &&
     'function' === typeof requirejs)
   ? define
// CommonJS - node.js
     : ('undefined' !== typeof module &&
        module.exports &&
        'function' === typeof require)
     ? function (deps, fact) { module.exports = fact() }
 // window === this
   : function (deps, fact) { this['events'] = fact() }
);



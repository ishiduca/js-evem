# evem

another EventEmitter for the browser

### example

```js
<script src="path/to/evem/index.js"></script>
function Timer (finish) {
    EventEmitter.call(this)
    this.finish = finish
}

(function inherits (T, E) {
    var F = function () {}
    F.prototype = E.prototype
    T.prototype = new F
})(Timer, EventEmitter)

Timer.prototype.start = function () {
    var that = this
    this.id  = setInterval(function () {
        that.finish ? that.emit('data', (that.finish -= 1))
                    : that.stop()
    }, 1000)
}
Timer.prototype.stop = function () {
    clearInterval(this.id)
    this.emit('end')
}

function puts (str) {
    document.querySelector('#timer').innerHTML = String(str)
}

var timer = new Timer(10)

timer.on('data', puts)
.once('end', function () {
    puts("!! finish")
})
.start()

```


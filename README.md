# evem

another EventEmitter for the browser

### example

```js
<script src="path/to/evem/index.js"></script>

var emitter = new events.EventEmitter;
var amount = 0;
var count  = 0;

emitter.on('data', function (a, b, c) {
    amount += (a + b + c);
    count++;
});

emitter.once('end', function () {
    console.log('Amount: ' + amount.toString());
    console.log('Count : ' + count.toString());
    console.log('Amount / Count: ' + (amount / count).toString());
});

emitter.emit('data', 1, 2, 3);
emitter.emit('end');

```


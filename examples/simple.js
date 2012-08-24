var assert = require('assert');
var EventEmitter = require('events').EventEmitter;
var dic = require('..');

// Create a new object from the EventEmitter class:
var myObject = new EventEmitter();

// Create another object:
var otherObject = new EventEmitter();

// Add both objecs to the container:
dic.add('myObject', myObject);
dic.add('otherObject', otherObject);

// Setup myObject to be dependent on otherObject:
myObject.dicCfg = {
  otherObject: true
};

// Wire all dependencies:
dic.wireAll();

// otherObject is now available as a property on myObject:
assert.strictEqual(otherObject, myObject.otherObject);

// Create yet another object and add it to the container:
var yetAnotherObject = new EventEmitter();
dic.add('yetAnotherObject', yetAnotherObject);

// Setup yetAnotherObject to be dependent on myObject and to
// react on the fire-event of myObject:
var fired = 0;
yetAnotherObject.dicCfg = {
  myObject: {
    'fire': function() {
      fired++;
    }
  }
};

// Wire all new dependencies again:
dic.wireAll();

// Emit the fire-event on myObject:
myObject.emit('fire');
assert.strictEqual(fired, 1);

// myObject is available as a property on yetAnotherObject:
assert.strictEqual(myObject, yetAnotherObject.myObject);

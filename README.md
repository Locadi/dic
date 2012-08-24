
# DIC (Dependency Injection Container)

The lightweight JavaScript Dependency Injection Container for  
[NodeJS](http://nodejs.org) and the browser.

DIC features late dependency binding/injection and dynamic  
mocking of objects.

## Install

### NodeJS

``npm install dic``

### Browser

[Download](http://raw.github.com/Umzugsagenten/dic/master/dic.js)
and load it inside your HTML:

```html
<script src="dic.js"></script>
```

This will give you an object called ``dic``, that is the Dependency  
Injection Container.

## Usage

### NodeJS

```js
var assert = require('assert');
var EventEmitter = require('events').EventEmitter;
var dic = require('dic');

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

// Create yet another object:
var yetAnotherObject = new EventEmitter();

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

// Emit the fire-event on myObject:
myObject.emit('fire');
assert.strictEqual(fired, 1);
```

## API

``.DIC``

``.createDIC()``

``.objects``

``.verbose``

``.has(name)``

``.get(name)``

``.add(name, object)``

``.remove(name)``

``.clear()``

``.wire(name)``

``.unwire(name)``

``.wireAll()``

``.unwireAll()``

``.mock(name, withObject)``

``.unmock(name)``

``.clearMocks()``

New BSD License
---------------

```
Copyright (c) 2012, UmzugsAgenten GmbH
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of UmzugsAgenten GmbH nor the
      names of its contributors may be used to endorse or promote products
      derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

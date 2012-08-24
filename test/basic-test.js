
var assert = require('assert');
var EventEmitter = require('events').EventEmitter;
var dic = require('..');

describe('DIC (Dependency Injection Container)', function() {
  var myObject, otherObject, yetAnotherObject;
  beforeEach(function() {
    // Create a new instance of DIC
    // dic = dic.createDIC();
    dic = new dic.DIC();
    // Create a new object from the EventEmitter class:
    myObject = new EventEmitter();
    // Create another object:
    otherObject = new EventEmitter();
    // Create yet another object:
    yetAnotherObject = new EventEmitter();
  });
  
  afterEach(function() {
    myObject = null;
    otherObject = null;
    yetAnotherObject = null;
    dic.clear();
  });
  
  it('is an module that is always an instance of DIC', function() {
    assert.ok(dic instanceof Object);
    assert.ok(dic instanceof dic.DIC);
  })
  
  describe('.DIC', function() {
    it('is the DIC class', function() {
      assert.ok(dic.DIC instanceof Function);
    });
    it('dic is an instance of dic.DIC', function() {
      assert.ok(dic instanceof dic.DIC);
    });
  });
  
  describe('.createDIC()', function() {
    it('creates a new DIC instance', function() {
      var ndic = dic.createDIC();
      assert.ok(ndic instanceof dic.DIC);
      assert.ok(ndic instanceof ndic.DIC);
      assert.ok(dic instanceof ndic.DIC);
      assert.notStrictEqual(dic, ndic);
    });
  });
  
  describe('.objects', function() {
    it('is an object containing the objects', function() {
      assert.ok(dic.objects instanceof Object);
      assert.deepEqual(dic.objects, {});
    });
  });
  
  describe('.cfgVar', function() {
    it('is the name of the property that defines the deps of an object', function() {
      assert.strictEqual(typeof dic.cfgVar, 'string');
    });
    it('defaults to "dicCfg"', function() {
      assert.strictEqual(dic.cfgVar, 'dicCfg');
    });
  });
  
  describe('.verbose', function() {
    it('is a boolean that enables/disables log-output', function() {
      assert.strictEqual(typeof dic.verbose, 'boolean');
    });
    it('defaults to false', function() {
      assert.strictEqual(dic.verbose, false);
    });
  });
  
  describe('.has(name)', function() {
    it('returns true if an object exists', function() {
      dic.add('myObject', myObject);
      dic.add('otherObject', otherObject);
      
      assert.strictEqual(dic.has('myObject'), true);
      assert.strictEqual(dic.has('otherObject'), true);
    });
    
    it('returns false if an object does not exist', function() {
      assert.strictEqual(dic.has('myObject'), false);
      assert.strictEqual(dic.has('otherObject'), false);
    });
  });
  
  describe('.get(name)', function() {
    it('returns an object from the container', function() {
      dic.add('myObject', myObject);
      dic.add('otherObject', otherObject);
      
      assert.strictEqual(dic.get('myObject'), myObject);
      assert.strictEqual(dic.get('otherObject'), otherObject);
      
      assert.strictEqual(dic.objects.myObject, myObject);
      assert.strictEqual(dic.objects.otherObject, otherObject);
    });
    
    it('returns undefined if the object does not exist', function() {
      assert.strictEqual(dic.get('myObject'), undefined);
    });
  });
  
  describe('.add(name, object)', function() {
    it('adds objects to the container', function() {
      dic.add('myObject', myObject);
      assert.strictEqual(dic.get('myObject'), myObject);
      assert.strictEqual(dic.objects.myObject, myObject);
    });
    
    it('throws if name exists', function() {
      try {
        dic.add('myObject', myObject);
        assert.ok(false);
      } catch(ex) {
        assert.ok(ex instanceof Error);
      }
    });
  });
  
  describe('.remove(name)', function() {
    it('removes objects from the container', function() {
      dic.add('myObject', myObject);
      
      assert.strictEqual(dic.get('myObject'), myObject);
      assert.strictEqual(dic.objects.myObject, myObject);
      
      dic.remove('myObject');
      
      assert.strictEqual(dic.get('myObject'), undefined);
      assert.strictEqual(dic.objects.myObject, undefined);
    });
    
    it('throws if name does not exist', function() {
      try {
        dic.remove('myObject');
        assert.ok(false);
      } catch(ex) {
        assert.ok(ex instanceof Error);
      }
    });
  });
  
  describe('.clear()', function() {
    it('removes all objects from the container', function() {
      dic.add('myObject', myObject);
      dic.add('otherObject', otherObject);
      
      assert.strictEqual(dic.get('myObject'), myObject);
      assert.strictEqual(dic.get('otherObject'), otherObject);
      
      dic.clear();
      
      assert.strictEqual(dic.get('myObject'), undefined);
      assert.strictEqual(dic.get('otherObject'), undefined);
    });
  });
  
  describe('.wire(name)', function() {
    it('makes other objects available as properties on the object', function() {
      dic
        .add('myObject', myObject)
        .add('otherObject', otherObject, {myObject:true})
      ;
      dic.wire('otherObject');
      assert.strictEqual(myObject, otherObject.myObject);
    });
    
    it('binds callbacks to events of other objects', function(cb) {
      dic
        .add('myObject', myObject)
        .add('otherObject', otherObject, {myObject: {'fire': cb}})
      ;
      dic.wire('otherObject');
      myObject.emit('fire');
    });
    
    it('sets .wired on the object to name', function() {
      dic.add('myObject', myObject);
      dic.wire('myObject');
      assert.strictEqual(myObject.wired, 'myObject');
    });
  });
  
  describe('.unwire(name)', function() {
    it('removes all pointers to other objects', function() {
      dic
        .add('myObject', myObject)
        .add('otherObject', otherObject, {myObject:true})
      ;
      dic.wire('otherObject');
      assert.strictEqual(myObject, otherObject.myObject);
      dic.unwire('otherObject');
      assert.strictEqual(otherObject.myObject, undefined);
    });
    
    it('unbinds from events of other objects', function(cb) {
      dic
        .add('myObject', myObject)
        .add('otherObject', otherObject, {myObject: {'fire': cb}})
      ;
      dic.wire('otherObject');
      dic.unwire('otherObject');
      myObject.emit('fire', new Error());
      cb();
    });
    
    it('removes .wired from the object', function() {
      dic.add('myObject', myObject);
      dic.wire('myObject');
      dic.unwire('myObject');
      assert.strictEqual(myObject.wired, undefined);
    });
  });
  
  describe('.wireLate() (internal function ;) )', function() {
    it('calls .wireLate(name) on every late-wired objects', function(cb) {
      dic.add('myObject', myObject, {otherObject: true});
      myObject.wireLate = function(name) {
        assert.strictEqual(name, 'otherObject');
        cb();
      };
      dic.wireAll();
      dic.add('otherObject', otherObject);
      dic.wireAll();
    });
  });
  
  describe('.wireAll()', function() {
    it('calls .wire() on completly wired objects', function(cb) {
      dic.add('myObject', myObject, {otherObject: true});
      var myObject_wire_called = false;
      myObject.wireLate = function(name) {
        assert.ok(false);
      };
      myObject.wire = function() {
        myObject_wire_called = true;
      };
      dic.add('otherObject', otherObject);
      otherObject.wire = function() {
        assert.ok(myObject_wire_called);
        cb();
      };
      dic.wireAll();
    });
  });
  
  describe('.unwireAll()', function() {
    it('calls .unwire() on all unwired objects', function(cb) {
      dic.add('myObject', myObject, {otherObject: true});
      var callWireCount = 0;
      var callUnwireCount = 0;
      myObject.wireLate = function(name) {
        assert.ok(false);
      };
      myObject.wire = function() {
        ++callWireCount;
      };
      myObject.unwire = function() {
        ++callUnwireCount;
      };
      dic.add('otherObject', otherObject);
      otherObject.wire = function() {
        ++callWireCount;
      };
      otherObject.unwire = function() {
        assert.strictEqual(callWireCount, 2);
        assert.strictEqual(callUnwireCount, 1);
        
        myObject.wire = null;
        myObject.unwire = null;
        otherObject.wire = null;
        otherObject.unwire = null;
        
        cb();
      };
      dic.wireAll();
      dic.unwireAll();
    });
  });
  
  describe('.mock(name, withObject)', function() {
    it('sets a mocking object to name');
  });
  
  describe('.unmock(name)', function() {
    it('unsets a mocking object');
  });
  
  describe('.clearMocks()', function() {
    it('unsets all mocking objects');
  });
  
  describe('.', function() {
  });
});

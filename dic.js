// DIC (Dependency Injection Container)
(function() {
    
  var each;
  if(Array.prototype.forEach) {
    each = function() {
      if(arguments.length === 3) {
        return Array.prototype.forEach.call(arguments[0], arguments[1], arguments[2]);
      }
      return Array.prototype.forEach.call(arguments[0], arguments[1]);
    };
  } else {
    each = _.each;
  }

  var keys = Object.keys || _.keys;
  
  function bindTo(obj, event, cb, scope) {
    if(typeof cb === 'function') {
      obj.on(event, cb, scope);
    } else {
      obj.on(event, scope[cb], scope);
    }
  }
  
  function unbindFrom(obj, event, cb, scope) {
    var off = obj.off || obj.unbind || obj.removeListener;
    if(typeof cb === 'function') {
      off.call(obj, event, cb, scope);
    } else {
      off.call(obj, event, scope[cb], scope);
    }
  }
  
  // Constructor
  function DIC(options) {
    if(!(this instanceof DIC)) return new DIC(options);
    
    options = options || {};
    
    this.verbose = !! options.verbose;
    this.cfgVar = options.cfgVar || 'dicCfg';
    
    this.objects = {};
    this.track = {};
    this.late = {};
    this.mocks = {};
  }
  
  DIC.prototype.DIC = DIC;
  
  DIC.prototype.createDIC = function(options) {
    return new DIC(options);
  };
  
  DIC.prototype.has = function(name) {
    return !!(this.mocks[name] || this.objects[name]);
  };
  
  DIC.prototype.get = function(name) {
    return this.mocks[name] || this.objects[name];
  };
  
  DIC.prototype.add = function(name, object, cfg) {
    var self = this;
    
    self.verbose && console.log('DIC.add', name);
    
    // The name must not exist
    if(this.objects[name]!=null) {
      throw new Error('DIC: Object already exists: '+name);
    }
    
    // Create .dicCfg on the object
    if(!object[self.cfgVar]) object[self.cfgVar] = {};
    
    // Merge cfg into .dicCfg
    if(cfg) {
      each(keys(cfg), function(k) {
        if(object[self.cfgVar][k] === true) return;
        if(!object[self.cfgVar][k]) return object[self.cfgVar][k] = cfg[k];
        
        if(cfg[k] && cfg[k] !== true) {
          each(keys(cfg[k]), function(k2) {
            object[self.cfgVar][k][k2] = cfg[k][k2];
          });
        }
      });
    }
    
    this.objects[name] = object;
    
    return this;
  };
  
  DIC.prototype.remove = function(name) {
    this.unwire(name, true);
    delete this.objects[name];
    return this;
  };
  
  DIC.prototype.clear = function() {
    this.unwireAll();
    this.objects = {};
    this.track = {};
    this.late = {};
  };
  
  DIC.prototype.wire = function(name, relax) {
    var self = this,
        res = true,
        obj = this.get(name),
        cfg;
    
    if(!obj) {
      throw new Error('No object with this name found: '+name);
    }
    
    // If object was already wired:
    //   Conservative: Throw 
    //   Relaxed: Return
    if(obj.wired) {
      if(relax) return false;
      throw new Error('Object already wired: '+name);
    }
    obj.wired = name;
    
    cfg = obj[self.cfgVar];
    
    each(keys(cfg), function(toName) {
      var toObj = self.get(toName);
      
      if(!toObj) {
        // Setup for late-wire
        self.verbose && console.log('DIC.wire (late)', name, '>', toName);
        
        if(!self.late[toName]) self.late[toName] = {};
        if(!self.late[toName][name]) self.late[toName][name] = [];
        
        if(cfg[toName] !== true) {
          each(keys(cfg[toName]), function() {
            self.verbose && console.log('DIC.wire (late)', name, '>', toName, '>', event);
            
            // Setup for late-wire
            self.late[toName][name].push([event, cfg[toName][event]]);
          });
        }
        res = false;
        return false;
      }
      
      self.verbose && console.log('DIC.wire', name, '>', toName);
      
      // Create a property to the object on this object
      obj[toName] = toObj;
      
      // Leave a track for later remove of toObj
      if(!self.track[toName]) self.track[toName] = [];
      self.track[toName].push(obj);
      
      // Bind to events of other objects
      if(cfg[toName] !== true) {
        each(keys(cfg[toName]), function(event) {
          self.verbose && console.log('DIC.wire', name, '>', toName, '>', event);
          
          bindTo(toObj, event, cfg[toName][event], obj);
        });
      }
    });
    
    return res;
  };
  
  DIC.prototype.unwire = function(name, relax) {
    var self = this,
        obj = this.get(name);
    
    // Name must exist
    if(!obj) {
      throw new Error('No object with this name found: '+name);
    }
    
    if(!obj.wired) {
      if(relax === true) return false;
      throw new Error('Object was not wired: '+name);
    }
    
    if(obj.wired !== name) {
      throw new Error('Conflict: Tried to unwire the object ' + obj.wired + ' with the different name: ' + name);
    }
    
    var cfg = obj[self.cfgVar];
    
    each(keys(cfg), function(toName) {
      // Remove the property to the object on all objects
      if(self.track[toName]) {
        while(self.track[toName].length) {
          var obj = self.track[toName].pop();
          delete obj[toName];
        }
        delete self.track[toName];
      }
      
      // Unbind from the events of the object
      if(cfg[toName] !== true) {
        each(keys(cfg[toName]), function(event) {
          unbindFrom(self.get(toName), event, cfg[toName][event], obj);
        });
      }
    });
    
    // Remove any .late-wire reference to name
    delete self.late[name];
    each(keys(self.late), function(toName) {
      delete self.late[toName][name];
    });
    
    // Notify the object about the unwire
    obj.unwire && obj.unwire();
    
    
    // Remove the wired-property
    delete obj.wired;
    
    return true;
  };
  
  DIC.prototype.wireLate = function() {
    var self = this,
        wired = [],
        toObj, obj;
    
    each(keys(self.late), function(toName) {
      toObj = self.get(toName);
      if(toObj) {
        each(keys(self.late[toName]), function(name) {
          obj = self.get(name);
          if(obj) {
            self.verbose && console.log('DIC.wireLate', name+'.'+toName);
            
            obj[toName] = toObj;
            
            var t = self.late[toName][name],
                tt;
            while(t.length) {
              tt = t.shift();
              self.verbose && console.log('DIC.wireLate', name, toName, tt[0]);
              bindTo(toObj, tt[0], tt[1], obj);
            }
            
            obj.wireLate && obj.wireLate(toName);
          }
          
          delete self.late[toName][name];
        });
        
        if(keys(self.late[toName]).length === 0) {
          wired.push(toName);
          delete self.late[toName];
        }
      }
    });
    
    return wired;
  };
  
  DIC.prototype.wireAll = function() {
    var self = this,
        wired = [];
    
    each(keys(self.objects), function(name) {
      if(self.wire(name, true)) {
        wired.push(name);
      }
    });
    
    wired = wired.concat(self.wireLate());
    
    each(wired, function(name) {
      self.objects[name].wire && self.objects[name].wire();
    });
  };
  
  DIC.prototype.unwireAll = function() {
    var self = this,
        unwired = [];
    
    each(keys(self.objects), function(name) {
      if(self.unwire(name, true) !== false) {
        unwired.push(name);
      }
    });
    
    each(unwired, function(name) {
      self.objects[name].unwire && self.objects[name].unwire();
    });
  };
  
  DIC.prototype.mock = function(name, object) {
    this.unwire(name);
    this.mocks[name] = object;
    this.wire(name);
    return this;
  };
  
  DIC.prototype.unmock = function(name) {
    this.unwire(name);
    delete this.mocks[name];
    this.wire(name);
    return this;
  };
  
  DIC.prototype.clearMocks = function() {
    var self = this;
    each(keys(self.mocks), function(n) {
      self.unmock(n);
      delete self.mocks[n];
    });
  };
  
  // Exports:
  var dic = new DIC();
  
  if(typeof exports !== 'undefined') {
    if(typeof module !== 'undefined' && module.exports) {
      exports = module.exports = dic;
    }
    exports.dic = dic;
  } else {
    this.dic = dic;
  }
  
}).call(this);
"use strict";
"use strict";

(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        // AMD. Register as an anonymous module.
        define(factory);
    } else if (typeof module === "object" && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(true);
    } else {
    	var base = factory();
    	window.base = base;
    }
}(this, function(){

    /*item*/
	var Item = function(base, path, name, value, isGetter){

		Object.defineProperty(this, "_base", {
			value : base,
			enumerable : false
		});

		Object.defineProperty(this, "path", {
			value : path,
			enumerable : false
		});

		Object.defineProperty(this, "name", {
			value : name,
			enumerable : false
		});

		if (typeof value == "function"){
			Object.defineProperty(this, "isGetter", {
				value : isGetter,
				enumerable : false,
				writable : true
			});
		}

		this._value = value;
	};

	Item.prototype = {
		get fullpath(){
			return this.path + "::" + this.name;
		},
		get value(){
			return this.get();
		},
		set value(value){
			this.set(value);
		},
		set : function(value){
			if (this.isGetter && typeof value != "function"){
				this.isGetter = false;
			}

			this._value = value;
			this._dispatch("change");
		},
		get : function(){
			return this.isGetter ? this._value() : this._value;
		},
		_dispatch : function(eventName){
			this._base._dispatch(this.fullpath, eventName);
		}
	};

	/*dir*/
	var Dir = function(path, base){
		Object.defineProperty(this, "_base", {
			value : base,
			enumerable : false
		});

		Object.defineProperty(this, "path", {
			value : path || "",
			enumerable : false
		});
	};

	Object.defineProperty(Dir.prototype, "set", {
		value : function(name, value){
			this._base.set(this.path + "::" + name, value);
		},
		enumerable : false
	});

	Object.defineProperty(Dir.prototype, "get", {
		value : function(name){
			return this._base.get(this.path + "::" + name);
		},
		enumerable : false
	});

	/*base*/
	var base = function(rawdesc, value){
		if (typeof value == "undefined"){
			return base.get(rawdesc);
		} else {
			base.set(rawdesc, value);
		}
	};

	base.content = new Dir("", base);

	base.eventsHandlers = {
		_observers : {}
	};

	base.reach = function(source, path){
	  var result = source;
	  path = path.split(".");

	  for (var a = 0; a < path.length; a++){
	      if (typeof result[path[a]] != "undefined"){
	        result = result[path[a]];
	      } else {
	        return null;
	      }
	  }

	  return result;
	};

	base.restObject = function(basePath, object, options){
		options = options || {};
		options.deep = options.deep || false;
		options.getters = options.getters || false;

		for (var k in object){
			if (typeof object[k] != "object" || !options.deep){
				if (options.getters){
					base.set(basePath + "::" + k, function(){
						return object[k];
					}, true);
				} else {
					base.set(basePath + "::" + k, object[k]);
				}
			} else if (typeof object[k] == "object" && options.deep){
				base.restObject(basePath + "." + k, object[k], options);
			}
		}

	}

	base.on = function(rawdesc, eventName, callback, obsName, instantCB){
		if (typeof obsName == "boolean"){
			instantCB = obsName;
			obsName = false;
		}


		obsName = obsName || ("sub-" + Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2));
		this.eventsHandlers[rawdesc] = this.eventsHandlers[rawdesc] || {};
		this.eventsHandlers[rawdesc][eventName] = this.eventsHandlers[rawdesc][eventName] || {};
		this.eventsHandlers[rawdesc][eventName][obsName] = callback;

		this.eventsHandlers._observers[obsName] = [rawdesc, eventName];

		if (instantCB && base.get(rawdesc)){
			callback(base.get(rawdesc));
		}

    	return obsName;
	};

	base.off = function(rawdesc, eventName, obsName){
		if (!obsName && !eventName){
			if (this.eventsHandlers._observers[rawdesc]) return base.off(this.eventsHandlers._observers[rawdesc][0], this.eventsHandlers._observers[rawdesc][1], rawdesc);
		} else {
			this.eventsHandlers[rawdesc] = this.eventsHandlers[rawdesc] || {};
			this.eventsHandlers[rawdesc][eventName] = this.eventsHandlers[rawdesc][eventName] || {};
			delete this.eventsHandlers[rawdesc][eventName][obsName];
			delete this.eventsHandlers._observers[obsName];
		}
		
	};

	base._dispatch = function(rawdesc, eventName){
		this.eventsHandlers[rawdesc] = this.eventsHandlers[rawdesc] || {};
		this.eventsHandlers[rawdesc][eventName] = this.eventsHandlers[rawdesc][eventName] || {};

		for (var k in this.eventsHandlers[rawdesc][eventName]){
			this.eventsHandlers[rawdesc][eventName][k](base.get(rawdesc));
		}
	};

	base.forEach = function(path, callback){
		path = this.path(path);

		for (var k in path){
			if (path[k] instanceof Item){
				callback(path[k].get(), path[k], k);
			}
		}
	};

	base.path = function(path){
		var curr = this.content;
		var dirPath = "";

		path = path.split(".");

		for (var a = 0, l = path.length; a < l; a++){
			dirPath = (a == 0) ? path[a] : dirPath + "." + path[a];
			curr[path[a]] = curr[path[a]] || new Dir(dirPath, base);
			curr = curr[path[a]];

		}

		return curr;
	};

	base.set = function(/*str*/rawdesc, /*any*/value, /*bool*/isGetter){
		var desc = rawdesc.split("::");
		var path = desc[0];
		var name = desc[1];

		var dir = this.path(path);

		if (dir[name] instanceof Item){
			dir[name].set(value);
		} else {
			var item = new Item(base, path, name, value, isGetter);
			dir[name] = item;

			Object.defineProperty(base.flat, rawdesc, {
				get : function(){
					return item.get();
				},
				set : function(value){
					item.set(value);
				}
			});

			item.set(value);
		}
	};

	base.get = function(/*str*/rawdesc){
		return this.flat[rawdesc];
	};

	base.remove = function(/*str*/name){
		delete this.content[name];
		delete this.getters[name];
	};

	base.log = function(){

		logLvl(base.content, "");

		function logLvl(data, levelPrefix){
			for (var k in data){
				if (!(data[k] instanceof Item)){
					console.log(levelPrefix + " "+ k);
					logLvl(data[k], levelPrefix + "--");
				} else {
					console.log(levelPrefix + " ::" + k);
				}
			}
		}
	};


	base.flat = {};
	base.Item = Item;

	return base;

}));

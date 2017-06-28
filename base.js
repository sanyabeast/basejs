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
	var Item = function(path, name, value){
		this._path = path;
		this._name = name;
		this._value = value;
		this._cbs = {
			change : []
		};
	};

	Item.prototype = {
		get value(){
			return this.get();
		},
		set value(value){
			this.set(value);
		},
		on : function(eventName, callback, obsName){
			obsName = obsName || Math.random().toString(36).substring(2);
			this._cbs[eventName][obsName] = callback;
		},
		off : function(eventName, obsName){
			delete this._cbs[eventName][obsName];
		},
		set : function(value){
			this._value = value;
			this._dispatch("change");
		},
		get : function(){
			return (typeof this._value == "function" ? this._value() : this._value);
		},
		_dispatch : function(eventName){
			for (var a in this._cbs[eventName]){
				this._cbs[eventName][a](this.get(), this);
			}
		},
	};

	/*dir*/
	var Dir = function(path, base){
		this._base = base;
		this._path = path || "";
	};

	Dir.prototype = {
		set : function(name, value){
			this._base.set(this._path + "::" + name, value);
		},
		get : function(name){
			return this._base.get(this._path + "::" + name);
		} 
	};

	/*base*/
	var base = function(rawdesc, value){
		if (typeof value == "undefined"){
			return base.get(rawdesc);
		} else {
			base.set(rawdesc, value);
		}
	};

	base.content = new Dir("", base);

	base.on = function(rawdesc, eventName, callback, obsName){
		var desc = rawdesc.split("::");
		var path = desc[0];
		var name = desc[1];

		var dir = this.path(path);

		if (dir[name] instanceof Item){
			dir[name].on(eventName, callback, obsName);
		}
	};

	base.off = function(rawdesc, eventName, obsName){
		var desc = rawdesc.split("::");
		var path = desc[0];
		var name = desc[1];

		var dir = this.path(path);

		if (dir[name] instanceof Item){
			dir[name].off(eventName, obsName);
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

	base.set = function(/*str*/rawdesc, /*any*/value){
		var desc = rawdesc.split("::");
		var path = desc[0];
		var name = desc[1];

		var dir = this.path(path);

		if (dir[name] instanceof Item){
			dir[name].set(value);	
		} else {
			var item = new Item(path, name, value);
			dir[name] = item;
			
			Object.defineProperty(base.flat, rawdesc, {
				get : function(){
					return item.get();
				},
				set : function(value){
					item.set(value);
				}
			});
		}	
	};

	base.get = function(/*str*/rawdesc){
		return this.flat[rawdesc];
		// var desc = rawdesc.split("::");
		// var path = desc[0];
		// var name = desc[1];

		// var dir = this.path(path);

		// if (dir[name] instanceof Item){
		// 	return dir[name].get();
		// } else {
		// 	return null;
		// }
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
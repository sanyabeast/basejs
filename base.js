'use strict';
'use strict';

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(true);
    } else {
    	var base = factory();
    	window.base = base;
    }
}(this, function(){

    /*value*/
	var Value = function(path, name, value){
		this._path = path;
		this._name = name;
		this._value = value;
		this._cbs = {
			change : []
		};
	};

	Value.prototype = {
		on : function(eventName, callback){
			this._cbs[eventName].push(callback);
		},
		set : function(value){
			this._value = value;
			if (this._cbs.change.length > 0){
				this._dispatch('change');
			}
		},
		get : function(){
			return (typeof this._value == 'function' ? this._value() : this._value);
		},
		_dispatch : function(eventName){
			for (var a = 0, l = this._cbs[eventName].length; a < l; a++){
				this._cbs[eventName][a](this.get(), this);
			}
		},
	};
	/*base*/
	var base = function(desc, value){
		if (typeof value == 'undefined'){
			return base.get(desc);
		} else {
			base.set(desc, value);
		}
	};

	base.content = {};

	base.on = function(desc, eventName, callback){
		var desc = desc.split("::");
		var path = desc[0];
		var name = desc[1];

		path = this.path(path);

		if (path[name] instanceof Value){
			path[name].on(eventName, callback);
		}
	};

	base.forEach = function(path, callback){
		path = this.path(path);

		for (var k in path){
			if (path[k] instanceof Value){
				callback(path[k].get(), path[k], k);
			}
		}
	};

	base.path = function(path){
		var curr = this.content;

		path = path.split(".");

		for (var a = 0, l = path.length; a < l; a++){
			curr[path[a]] = curr[path[a]] || {};
			curr = curr[path[a]];
		}

		return curr;
	};

	base.set = function(/*str*/desc, /*any*/value){
		var desc = desc.split("::");
		var path = desc[0];
		var name = desc[1];

		console.log(path);

		path = this.path(path);

		if (path[name] instanceof Value){
			path[name].set(value);	
		} else {
			path[name] = new Value(path, name, value);
		}	

	};

	base.get = function(/*str*/desc){
		var desc = desc.split("::");
		var path = desc[0];
		var name = desc[1];

		path = this.path(path);

		if (path[name] instanceof Value){
			return path[name].get();
		} else {
			return null;
		}
	};

	base.remove = function(/*str*/name){
		delete this.content[name];
		delete this.getters[name];
	}

	return base;

}));
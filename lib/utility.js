var isArray = Array.isArray ?
	function(o) {
		return Array.isArray(o);
	} : function(o) {
		return Object.prototype.toString.call(o) === "[object Array]";
	};


function isElement(obj) {
    var isEl = false;
    try {
        isEl = obj instanceof HTMLElement;
	} catch(err) { //IE
        isEl = obj.nodeType && obj.nodeType === 1;
    }
	return isEl;
}


function all(iteratable, f) {
	var isAll = true;
	map(iteratable, function(e) {
		if ( !f(e) ) {
			return isAll = false;
		}
	})
	return isAll;
}


var map = function(iteratable, f) {
	var itr = iteratable;
	
	if ( isArray(iteratable) || iteratable instanceof NodeList
		|| (iteratable.length >= 1 && iteratable[0]) //IE
	) {
		itr = [];
		for (var i=0; i<iteratable.length; i++) {
			var v = f(iteratable[i], i);
			if (v === false) {
				return itr;
			} else {
				itr.push(v);
			}
		}
	} else if (typeof iteratable === 'object') {
		itr = {};
		for (var k in iteratable) {
			var v = f(iteratable[k], k);
			if (v === false) {
				return itr;
			} else {
				itr[k] = v;
			}
		}
	}
	return itr;
};


var nop = function() {};


var exist = function(arg) { return typeof arg !== 'undefined'; };


var error = function(e){
	if ( exist(console) ){
		console.log(e);
		debugger;
	}
	throw("[Bindable Template Engine's ERROR] " + e);
}


var prefixSearch = function(searchedObject, searchingPath) {
	var node = searchedObject;
	var prefixPath = [];
	var i=0;
	for (i=0; i<searchingPath.length; i++) {
		var key = searchingPath[i];
		if ( node.hasOwnProperty(key) ) {
			node = node[key];
			prefixPath.push(key);
		} else {
			break;
		}
	}
	var restPath = searchingPath.slice(i, searchingPath.length);
	return {
		prefixPath: prefixPath,
		restPath: restPath,
		node: node
	};
};


var find = function(root, selector) {
	//a node set is passed
	if(typeof selector !== 'string'){
		return selector;
	}
	if(typeof root === 'string'){
		selector = root;
		root = false;
	}
	if(typeof document.querySelectorAll !== 'undefined'){
		return (root||document).querySelectorAll(selector);
	}else{
//		return error('You can test Bind standalone with: iPhone, FF3.5+, Safari4+ and IE8+\n\nTo run Bind on your browser, you need a JS library/framework with a CSS selector engine');
		return error('You can test Bind standalone with: iPhone, FF3.5+, Safari4+ and IE8+');
	}
};

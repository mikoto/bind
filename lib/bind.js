(function() {

$b = {};

// ---------------------------------------
var isArray = Array.isArray ?
	function(o) {
		return Array.isArray(o);
	} :
	function(o) {
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

var nop = function() {};

var exist = function(arg) { return typeof arg !== 'undefined'; };

var error = function(e){
	if ( exist(console) ){
		console.log(e);
		debugger;
	}
	throw("[Bindable Template Engine's ERROR] " + e);
}



var render = $b.render = function(templates, data, directive, bindCompleteHandler, parentBindedDataMap) {
	var BindedDataMap = {};
	var FunctionBinderMap = {};
	

// -------------------------------------

	
	var EventManager = BindedDataMap.event = {};
	if (parentBindedDataMap) {
		EventManager = BindedDataMap.event = parentBindedDataMap.event;
	} else {
		EventManager.eventHolder = document.createElement('div');
		document.getElementsByTagName('body')[0].appendChild(EventManager.eventHolder);
		EventManager.dataContainer = {};
		
		EventManager.dispatchEvent = function(eventType, value) {
			if (EventManager.eventHolder.dispatchEvent) {
				var event = document.createEvent('Event');
				event.initEvent(eventType,false,true);
				event.data = value;
				EventManager.eventHolder.dispatchEvent(event);
			} else if (document.attachEvent) {
				//IE
				if (EventManager.eventHolder.nodeType === 1 && EventManager.eventHolder[eventType]>=0) {
					EventManager.dataContainer[eventType] = value;
                    EventManager.eventHolder[eventType]++;
                }
			}
		};
		EventManager.addEventListener = function(eventType, callback, useCapture) {
			if (EventManager.eventHolder.addEventListener) {
				EventManager.eventHolder.addEventListener(
					eventType,
					function(event) { callback(event.data); },
					useCapture
				);
			} else if (document.attachEvent) {
				//IE
				if (!EventManager.eventHolder[eventType]) {
				    EventManager.eventHolder[eventType] = 0;
				}
				EventManager.eventHolder.attachEvent("onpropertychange", function(event){
				    if (event.propertyName == eventType) {
				        callback(EventManager.dataContainer[eventType]);
				    }
				});
			}
		};
	}

// -------------------------------------
	
	
	var Binder = function(action, element) {
		var v = undefined;
		
		this.get = function() {
			return v;
		};
		
		this.set = function(value, noDispatchEvent) {
			v = value;
			action(element, v);
			if (!noDispatchEvent) {
				EventManager.dispatchEvent('change', {from:this, target:element, data:data, binds:parentBindedDataMap || BindedDataMap});
			}
		};
		
		this.getElement = function() { return element; };
	};
	
	
	var BinderSet = function() {
		var binders = [];
		var v;
		
		var bs = function(value) {
			if ( exist(value) ) {
				v = value;
				// set methodは副作用有り
				map(binders, function(b) { return b.set(v); });
				return v;
			} else {
				return v;
			}
		};
		
		bs.appendBinder = function(binder) {
			return binders.push(binder);
		};
		
		bs.getElements = function() {
			return map(binders, function(b) { return b.getElement(); });
		};
		
		return bs;
	};
	
	var FunctionBinder = function(f) {
		var binders = [];
		var v;
		
		var bs = function(value) {
			if ( exist(value) ) {
				v = f(value);
				// set methodは副作用有り
				map(binders, function(b) { return b.set(v, true); });
				return v;
			} else {
				return v;
			}
		};
		
		bs.appendBinder = function(binder) {
			return binders.push(binder);
		};
		
		
		bs.setEventHandler = function() {
			var handler = function(event) {
				if (v !== f(event)) {
					bs(event);
				}
			};
					
			EventManager.addEventListener('change', handler);
			EventManager.addEventListener('append', handler);
			EventManager.addEventListener('remove', handler);
		};
		
		bs.getElements = function() {
			return map(binders, function(b) { return b.getElement(); });
		};
		
		return bs;
	};
	
	var ObjectBinderSet = function(path) {
		var bs;
		
		if (path.length > 1) {
//			var v = {};
			var key = path[1];
			var keys = [];
	
			bs = function(value) {
				if ( exist(value) ) {				
//					for (var i=0; i<keys.length; i++) {
//						var key = keys[i];
//						if (value.hasOwnProperty(key)) {
//							v[key] = value[key];
//							bs[key](v[key]);
//						}
//					}
					map(keys, function(key) {
						if ( value.hasOwnProperty(key) ) {
							bs[key](value[key]);
						}
					});
					return value;
				} else {
					var obj = {};
					map(keys, function(key) {
						obj[key] = bs[key]();
					});
					return obj;
//					return v;
				}
			};
			
			bs.appendBinderSet = function(key, binderSet) {
				bs[key] = binderSet;
				keys.push(key);
			};
			bs.appendBinderSet(key, ObjectBinderSet(path.slice(1, path.length)));
			
			bs.appendBinder = function(binder, path) {
				var node = bs;
				map(path.slice(1, path.length), function(key) {
					if (node.hasOwnProperty(key)) {
						node = node[key]
						return node;
					} else {
						return false;
					}
				});
				return node.appendBinder(binder);
			};
			
			bs.getElements = function() {
				error("'getElements' is only supported for 'Variable' and 'Function'");
			};
		} else {
			bs = BinderSet();
		}
		
		return bs;
	};
	
	var ArrayBinder = function(templates, loopDirective) {
		var clonedTemplates = map(templates, function(template) {
			var parentNode = template.parentNode;
			parentNode.removeChild(template);
			
			var clone = template.cloneNode(true);
			clone._parentNode = parentNode;
			
			return clone;
		});
	
		var bindedDataArray = [];
		var elementArray = [];
	
	
		var get = this.get = function() {
			return bindedDataArray;
		};
		
		var set = this.set = function(value) {
			if ( isArray(value) ) {
				removeAll();
				map(value, push);
				return bindedDataArray;
			}
		};
		
		var remove = this.remove = function(index) {
			if (elementArray[index].parentNode) {
				elementArray[index].parentNode.removeChild(elementArray[index]);
				var e = elementArray.splice(index,1);
				var b = bindedDataArray.splice(index,1);
				
				EventManager.dispatchEvent('remove', {from:b, target:e, data:data, binds:parentBindedDataMap || BindedDataMap});
			}
		};
		
		var removeAll = this.removeAll = function() {
			map(elementArray, function(e) { e.parentNode && e.parentNode.removeChild(e); });
			elementArray = [];
			bindedDataArray = [];
		};
		
		var push = this.push = function(arrayElementData) {
			var newElements = createElements(arrayElementData);
			map(newElements, function(e) {
				e._parentNode.appendChild(e);
				
				elementArray.push(e);
				bindedDataArray.push(e._binder);
				
//				EventManager.dispatchEvent('append', {from:e._binder, target:e, data:data, binds:BindedDataMap});
				
				delete e._parentNode;
				delete e._binder;				
				
				return e;
			});
			EventManager.dispatchEvent('append', {from:bindedDataArray, target:newElements, data:data, binds:parentBindedDataMap || BindedDataMap});
		};
		
		var createElements = function(arrayElementData) {
			data[loopDirective.specification.itemName] = arrayElementData;
			
			return map(clonedTemplates, function(t) {
				var clone = t.cloneNode(true);
				clone._parentNode = t._parentNode;
				clone._binder = undefined;
			
				var nestedBindedData = render([clone], data, loopDirective.original, nop, BindedDataMap);
				if (nestedBindedData[loopDirective.specification.itemName]) {
					nestedBindedData = nestedBindedData[loopDirective.specification.itemName];
					nestedBindedData(arrayElementData);
				}
				clone._binder = nestedBindedData;
				
				delete data[loopDirective.specification.itemName];
				
				return clone;
			});
		};
	};
	
	var ArrayBinderSet = function() {
		var binders = [];
		
		var bs = function(value) {
			if (typeof value === 'number') {
				var index = Math.ceil(Math.abs(value));
//				var returnedBinderMap = {};
//				var targetData = v[index];
				return parseBinders()[index];
			} else if ( isArray(value) ) {
				// set methodは副作用有り
				map(binders, function(b) { return b.set(value); });
				return value;
			} else {
				return map(binders[0].get(), function(b) { return b(); });
			}
		};
		
		var parseBinders = function() {
			var parse = function(data, binders) {
				if ( isArray(data) ) {
					var getterSetter = function(value) {
						if (typeof value === 'number') {
							var index = Math.ceil(Math.abs(value));
							return map(binders[0](), function(targetData, index) {
								return parse(
									targetData,
									map(binders, function(arrayBinderSet) {
										return arrayBinderSet(index);
									})
								);
							})[index];
						} else {
							map(binders, function(arrayBinderSet) { return arrayBinderSet(value); });
							return binders[0]();
						}
					};
					getterSetter.push = function(arg) {
						map(binders, function(arrayBinderSet) {
							return arrayBinderSet.push(arg);
						})
					};
					getterSetter.remove = function(arg) {
						map(binders, function(arrayBinderSet) {
							return arrayBinderSet.remove(arg);
						})
					};
					getterSetter.removeAll = function() {
						map(binders, function(arrayBinderSet) {
							return arrayBinderSet.removeAll();
						})
					};
					return getterSetter;
				} else if (typeof data === 'object') {
					var getterSetter = function(value) {
						if ( exist(value) ) {
							map(binders, function(binder) { return binder(value); });
						}
						return binders[0]();
					};
					map(data, function(v,k) {
						getterSetter[k] = parse(
							v,
							map(binders, function(binder) { return binder[k]; })
						);
					});
					return getterSetter;
				} else {
					return function(value) {
						if ( exist(value) ) {
							map(binders, function(binder) { return binder(value); });
						}
						return  binders[0]();
					};
				}
			};
			return map(bs(), function(targetData, index) {
				return parse(
					targetData,
					map(binders, function(arrayBinder) {
						return arrayBinder.get()[index];
					})
				);
			});
		};
		
		bs.appendBinder = function(binder) {
			return binders.push(binder);
		};
		
		bs.remove = function(index) {
			map(binders, function(b) { return b.remove(index); });
		};
		
		bs.removeAll = function() {
			map(binders, function(b) { return b.removeAll(); });
		}
		
		bs.push = function(arrayElementData) {
			map(binders, function(b) { return b.push(arrayElementData); });
		};
		
		bs.getElements = function() {
			error("'getElements' is only supported for 'Variable' and 'Function'");
		};
		
		return bs;
	};
	
	
	var getAction = function(selectorSpecifier){// getAction(selectorSpecifier)(element, value);
		var attr = selectorSpecifier.attr;
		if (attr) {
			// Attribute Set Action
			var isStyle = (/^style$/i).test(attr);
			var isClass = (/^class$/i).test(attr);
			var attrName = isClass ? 'className' : attr;
			attrSet = function(element, value) {
				if(!value && value !== 0){
					if (attrName in element && !isStyle) {
						try{
							node[attrName] = ''; //needed for IE to properly remove some attributes
						}catch(e){} //FF4 gives an error sometimes -> try/catch
					} 
					//no more nodeType check since 
					element.removeAttribute(attrName);
				}else{
					element.setAttribute(attrName, value);
				}
			};
			if (isStyle) { //IE
				get = function(e){
					return e.style.cssText;
				};
			} else if (isClass) { //IE
				get = function(e){
					return e.className;
				};
			} else {
				get = function(e){ 
					return e.getAttribute(attr);
				};
			}
	
			if(selectorSpecifier.prepend){
				return function(element, value){ 
					attrSet(element, value + (get(element) || '') ); 
				};
			}else if(selectorSpecifier.append){
				return function(element, value){ 
					attrSet(element, (get(element) || '') + value ); 
				};
			}else{
				return attrSet;
			}
		} else {
			// Element Set Action
			if (selectorSpecifier.prepend) {
				return function(element, value) { element.insertBefore(document.createTextNode(value), element.firstChild);	};
			} else if (selectorSpecifier.append) {
				return function(element, value) { element.appendChild( document.createTextNode(value) ); };
			} else {
				return function(element, value) {
					while (element.firstChild) { element.removeChild(element.firstChild); }
					element.appendChild( document.createTextNode(value) );
				};
			}
		}
	};
	
	

// -------------------------------------	
	
	
	
	var load = function(handler) {
		var _templates = templates; templates = undefined;
		var _data = data; data = undefined;
		var _directive = directive; directive = undefined;
		
		var completeHandler = function() {
			if ( exist(templates) && exist(data) && exist(directive) ) {
				handler(templates);
				
				if (typeof bindCompleteHandler === 'function') {
					bindCompleteHandler(BindedDataMap);
				}
			}
		};
		
		if (_templates.isUrl) {
			_templates.load(
				function(arg) {
					var fragment = document.createElement('div');
					fragment.innerHTML = arg;
					templates = [fragment];
					_templates.parent.appendChild(fragment)
					completeHandler();
				}, 'html'
			);
		} else if (typeof _templates === 'string') {
			templates = find(document, _templates);
			completeHandler();
		} else if (all(_templates, isElement)) {
			templates = find(document, _templates);
			completeHandler();
		}
		
		if (_data.isUrl) {
			_data.load(
				function(arg) {
					data = arg;
					completeHandler();
				}, 'json'
			);
		} else {
			data = _data;
			completeHandler();
		}
		
		if (_directive.isUrl) {
			_directive.load(
				function(arg) {
					directive = arg;
					completeHandler();
				}, 'json'
			);
		} else {
			directive = _directive;
			completeHandler();
		}
	};
	
	var loopNode = function(selectorSpecifier, root) {
		var parseLoopDirective = function(directive) {
			var parse = function(loopDirectiveKey) {
				var m = loopDirectiveKey.match(/^(\w+)\s*<-\s*(\S+)?$/);
				
				// declaration errors
				if(m === null){
					error('"' + p + '" must have the format loopItem<-loopArray');
				}
				if(m[1] === 'item'){
					error('"item<-..." is a reserved word for the current running iteration.\n\nPlease choose another name for your loop.');
				}
				
				if( !m[2] || (m[2] && (/context/i).test(m[2])) ) { //undefined or space(IE) 
					m[2] = function(data){return data.context;};
				}
				
				return {itemName: m[1], arrayName: m[2]};
			};
			
			var loopDirective = {
				filter: undefined,
				sort: undefined,
				specification: undefined,
				original: undefined
			};
			
			var already = false;
			map(directive, function(v, key) {
				if (key == 'filter' || key == 'sort') {
					loopDirective[key] = directive[key];
				} else {
					if (already) {
						error( 'cannot have a second loop declared for the same node:' + key );
					} else {
						loopDirective.specification = parse(key);
						loopDirective.original = directive[key];
						already = true;
					}
				}
			});
			
			return loopDirective;
		};
		
		var loopDirective = parseLoopDirective(directive[selectorSpecifier.original]);
		
		var loopRoots = find(root, selectorSpecifier.original);
		var specifiedDataList = readData(loopDirective.specification.arrayName);
		if (exist(data[loopDirective.specification.itemName])) {
			error( 'identifier of loop variable is conflict' );
		} else {
			var binder = new ArrayBinder(loopRoots, loopDirective);
			var targetDirective = loopDirective.specification.arrayName;
			if (targetDirective.match('\\.')) {
				// Object
				var path = targetDirective.split('.');
				var key = path[0];
				var rootObjectBinderSet;
				
				var searchingResult = prefixSearch(BindedDataMap, path);
				var pPath = searchingResult.prefixPath;
				var rPath = searchingResult.restPath;
				
				var binderSet;
				if (rPath.length > 1) {
					binderSet = ObjectBinderSet(rPath.slice(0, rPath.length));
					binderSet.appendBinderSet(rPath[rPath.length-1], ArrayBinderSet());
				} else if (rPath.length == 1) {
					binderSet = ArrayBinderSet();
				}
				
				if (pPath.length != 0 && rPath.length != 0) {
					searchingResult.node.appendBinderSet(rPath[0], binderSet);
					rootObjectBinderSet = BindedDataMap[pPath[0]];
				} else if (pPath.length == 0) {
					parent.appendBinderSet(path[path.length-1], binderSet);
					rootObjectBinderSet = BindedDataMap[key] = parent;
				} else if (rPath.length == 0) {
					rootObjectBinderSet = BindedDataMap[pPath[0]];
				}
				
				rootObjectBinderSet.appendBinder(binder, path);
				rootObjectBinderSet(data[key]);
			} else if (targetDirective !== "") {
				// Array Variable
				var binderSet;
				if ( exist(BindedDataMap[targetDirective]) ) {
					binderSet = BindedDataMap[targetDirective];
				} else {
					binderSet = BindedDataMap[targetDirective] = ArrayBinderSet();
				}
				binderSet.appendBinder(binder);
				binderSet(data[targetDirective]);
			}
		}
	};
	
	var processSelector = function(selectorSpecifier, directive, root) {
		var selector = selectorSpecifier.selector;
		var elements = (selector && selector !== '.') ? find(root, selector) : [root];
		
		if(elements.length === 0){
			error( 'The selector "' + selector + '" was not found in the template:\n' + root );
		}
		
		map(elements, function(element) {
			if(typeof directive[selector] === 'object') {
				loopNode(selectorSpecifier, element.parentNode);
			} else {
				var action = getAction(selectorSpecifier);
				var key = selectorSpecifier.original;
				bind(key, action, element);
			}
		});
	};
	
	var parse = function(directive, template) {
		map(directive, function(value, selector) {
			// allow selector separation by comma
			var selectors = selector.split(/\s*,\s*/);
	
			var selectorReg = /^(\+)?([^\@\+]+)?\@?([^\+]+)?(\+)?$/;
			map(selectors, function(selector) {
				var m = selector.match(selectorReg);
				if(!m){
					error( 'bad selector syntax: ' + selector );
				}
				
				processSelector({
					original: m[0],
					prepend: m[1],
					selector: m[2],
					attr: m[3],
					append: m[4]
				}, directive, template);
			});
		});
	};
	
	var readData = function(targetDirective) {
		if (typeof targetDirective === 'string') {
			if (targetDirective.match('\\.')) {
				var path = targetDirective.split('.');
				var v = data;
				var vs = map(path, function(key) {
					if (v.hasOwnProperty(key)) {
						v = v[key]
						return v;
					} else {
						return false;
					}
				});
				if (vs.length === path.length) {
					return vs[vs.length-1];
				} else {
					return undefined;
				}
			} else if (targetDirective !== "") {
				return data[targetDirective];
			}
		}
		return undefined;
	};
	
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
	
	var bind = function(selector, action, element) {
		var binder = new Binder(action, element);
		var targetDirective = directive[selector];
		
		var type = typeof targetDirective;
		if ( isArray(targetDirective) ) {
			// Array
			error("not support");
		} else if (type === 'function') {
			// Function
			var binderSet;
			if ( exist(FunctionBinderMap[selector]) ) {
				binderSet = FunctionBinderMap[selector];
			} else {
				binderSet = FunctionBinder(targetDirective);
				FunctionBinderMap[selector] = binderSet;
			}
			binderSet.appendBinder(binder);
		} else if (type === 'string') {
			if (targetDirective.match('\\.')) {
				// Object
				var path = targetDirective.split('.');
				var key = path[0];
				var rootObjectBinderSet;
				
				var searchingResult = prefixSearch(BindedDataMap, path);
				var pPath = searchingResult.prefixPath;
				var rPath = searchingResult.restPath;
				
				if (pPath.length != 0 && rPath.length != 0) {
					searchingResult.node.appendBinderSet(rPath[0], ObjectBinderSet(rPath));
					rootObjectBinderSet = BindedDataMap[pPath[0]];
				} else if (pPath.length == 0) {
					rootObjectBinderSet = BindedDataMap[key] = ObjectBinderSet(path);
				} else if (rPath.length == 0) {
					rootObjectBinderSet = BindedDataMap[pPath[0]];
				}
				
				rootObjectBinderSet.appendBinder(binder, path);
				rootObjectBinderSet(data[key]);
			} else if (targetDirective !== "") {
				// Variable
				var binderSet;
				if ( exist(BindedDataMap[targetDirective]) ) {
					binderSet = BindedDataMap[targetDirective];
				} else {
					binderSet = BindedDataMap[targetDirective] = BinderSet();
				}
				binderSet.appendBinder(binder);
				binderSet(data[targetDirective]);
			}
		}
	};

	load(function(templates) {
		map(templates, function(template) {
			parse(directive, template);
		});
		
		map(FunctionBinderMap, function(fbset) {
			fbset({
				data: data,
				binds: parentBindedDataMap || BindedDataMap
			});
			fbset.setEventHandler();
		});
	});
	
	
	return BindedDataMap;
};



// ---------------------------------------



var Net = (function() {
	var createXHR = function() {
		var xhr;
		if (XMLHttpRequest) {
			xhr = new XMLHttpRequest();
		} else {
			try {
				xhr = new ActiveXObject('MSXML2.XMLHTTP.6.0');
			} catch (e) {
				try {
					xhr = new ActiveXObject('MSXML2.XMLHTTP.3.0');
				} catch (e) {
					try {
						xhr = new ActiveXObject('MSXML2.XMLHTTP');
					} catch (e) {
						error('Please activate ActiveX');
					}
				}
			}
		}
		return xhr;
	};
	
	var ajax = function(url, successHandler, method, parameters) {
		var xhr = createXHR();
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4) {
				if (xhr.status == 200) {
					successHandler(xhr.responseText);
				} else {
					error("status = " + xhr.status);
				} 
			}
		}
		xhr.open(method, url);
		var ps = undefined;
		if (method === 'POST') {
			var ps = [];
			for (var k in parameters) { ps.push( k + "=" + encodeURIComponent(parameters[k]) ); }
			ps = ps.join("&");
			xhr.setRequestHeader("Cache-Control", "no-cache");
			xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded;charset=UTF-8');
		}
		xhr.send(ps);
	};
	
	return {
		get: function(url, successHandler) {
			ajax(url, successHandler, 'GET');
		},
		
		post: function(url, successHandler, parameters) {
			ajax(url, successHandler, 'POST', parameters);
		}
	};
})();


var url = $b.url = function(us) {
	var url = {};
	var urlString = us;
	var parameters = undefined;
	var chacheData = undefined;
	var chacheMode = true;
	var functionQueue = [];
	
	var applyFunctionQueue = function(data) {
		var d = data;
		map(functionQueue, function(f) {
			d = f(d);
		});
		return d;
	};
	
	
	url.parent = undefined;
	url.isUrl = true;
	
	url.load = function(handler, type) {
		var storeChache = chacheMode ? function(data) {
			chacheData = data;
		} : nop;
		
		var successHandler = exist(handler) ? function(responseText) {
			storeChache(responseText);
			
			if (type === 'html') {
				handler( applyFunctionQueue(responseText) );
			} else if (type === 'json') {
				handler( applyFunctionQueue( eval( "(" + responseText + ")" ) ) );
			} else {
				handler( applyFunctionQueue(responseText) );
			}
		} : storeChache;
		
		if ( exist(chacheData) ) {
			successHandler(chacheData);
		} else {
			if (parameters) {
				Net.post(urlString, successHandler, parameters);
			} else {
				Net.get(urlString, successHandler);
			}
		}
		return url;
	};
	
	url.to = function(selector) {
		url.parent = find(document, selector)[0];
		return url;
	};
	
	url.parameters = function(ps) {
		if (typeof ps === 'object') {
			parameters = ps;
			chacheData = undefined;
		} else {
			error("Invalid parameters");
		}
		return url;
	};
	
	url.chache = function(cm) {
		chacheMode = cm == true;
		if (!chacheMode) {
			chacheData = undefined;
		}
		return url;
	};
	
	url.apply = function(f) {
		functionQueue.push(f);
		return url;
	};
	
	url.extend = function(parent) {
		return url.apply(function(data) {
			map(parent, function(v,k) {
				!data.hasOwnProperty(k) && data[k] = v;
			});
			return data;
		});
	};
	
	url.extendedBy = function(child) {
		return url.apply(function(data) {
			map(child, function(v,k) {
				data[k] = v;
			});
			return child;
		});
	};

	return url;
};

})();
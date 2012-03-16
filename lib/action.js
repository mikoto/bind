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

var getDomAction = function(selectorSpecifier, element) {
	var action = getAction(selectorSpecifier);
	var f = function(value) {
		action(element, value);
	};
	
	f.element = element;
	f.template = element.cloneNode(true);
	f.parentNode = element.parentNode;
	
	f.clone = function() {
		var action = getDomAction(selectorSpecifier, f.template.cloneNode(true));
		action.parentNode = f.parentNode;
		return action;
	};
	
	return f;
};


var readData = function(BindedDataMap, targetDirective) {
	if (typeof targetDirective === 'string') {
		if (targetDirective.match('\\.')) {
			var path = targetDirective.split('.');
			var v = BindedDataMap;
			var vs = map(path, function(key) {
				if (v.hasOwnProperty(key)) {
					v = v[key]
					return v;
				} else {
					return false;
				}
			});
			if (vs.length === path.length) {
				return vs[vs.length-1]();
			} else {
				return undefined;
			}
		} else if (targetDirective !== "") {
			return BindedDataMap[targetDirective]();
		}
	}
	return undefined;
};


//var loopNode = function(selectorSpecifier, root) {
//	var parseLoopDirective = function(directive) {
//		var parse = function(loopDirectiveKey) {
//			var m = loopDirectiveKey.match(/^(\w+)\s*<-\s*(\S+)?$/);
//			
			// declaration errors
//			if(m === null){
//				error('"' + p + '" must have the format loopItem<-loopArray');
//			}
//			if(m[1] === 'item'){
//				error('"item<-..." is a reserved word for the current running iteration.\n\nPlease choose another name for your loop.');
//			}
//			
//			if( !m[2] || (m[2] && (/context/i).test(m[2])) ) { //undefined or space(IE) 
//				m[2] = function(data){return data.context;};
//			}
//			
//			return {itemName: m[1], arrayName: m[2]};
//		};
//		
//		var loopDirective = {
//			filter: undefined,
//			sort: undefined,
//			specification: undefined,
//			original: undefined
//		};
//		
//		var already = false;
//		map(directive, function(v, key) {
//			if (key == 'filter' || key == 'sort') {
//				loopDirective[key] = directive[key];
//			} else {
//				if (already) {
//					error( 'cannot have a second loop declared for the same node:' + key );
//				} else {
//					loopDirective.specification = parse(key);
//					loopDirective.original = directive[key];
//					already = true;
//				}
//			}
//		});
//		
//		return loopDirective;
//	};
//	
//	var loopDirective = parseLoopDirective(directive[selectorSpecifier.original]);
//	
//	var loopRoots = find(root, selectorSpecifier.original);
//	var specifiedDataList = readData(loopDirective.specification.arrayName);
//	if (exist(data[loopDirective.specification.itemName])) {
//		error( 'identifier of loop variable is conflict' );
//	} else {
//		var binder = new ArrayBinder(loopRoots, loopDirective);
//		var targetDirective = loopDirective.specification.arrayName;
//		if (targetDirective.match('\\.')) {
			// Object
//			var path = targetDirective.split('.');
//			var key = path[0];
//			var rootObjectBinderSet;
//			
//			var searchingResult = prefixSearch(BindedDataMap, path);
//			var pPath = searchingResult.prefixPath;
//			var rPath = searchingResult.restPath;
//			
//			var binderSet;
//			if (rPath.length > 1) {
//				binderSet = ObjectBinderSet(rPath.slice(0, rPath.length));
//				binderSet.appendBinderSet(rPath[rPath.length-1], ArrayBinderSet());
//			} else if (rPath.length == 1) {
//				binderSet = ArrayBinderSet();
//			}
//			
//			if (pPath.length != 0 && rPath.length != 0) {
//				searchingResult.node.appendBinderSet(rPath[0], binderSet);
//				rootObjectBinderSet = BindedDataMap[pPath[0]];
//			} else if (pPath.length == 0) {
//				parent.appendBinderSet(path[path.length-1], binderSet);
//				rootObjectBinderSet = BindedDataMap[key] = parent;
//			} else if (rPath.length == 0) {
//				rootObjectBinderSet = BindedDataMap[pPath[0]];
//			}
//			
//			rootObjectBinderSet.appendBinder(binder, path);
//			rootObjectBinderSet(data[key]);
//		} else if (targetDirective !== "") {
			// Array Variable
//			var binderSet;
//			if ( exist(BindedDataMap[targetDirective]) ) {
//				binderSet = BindedDataMap[targetDirective];
//			} else {
//				binderSet = BindedDataMap[targetDirective] = ArrayBinderSet();
//			}
//			binderSet.appendBinder(binder);
//			binderSet(data[targetDirective]);
//		}
//	}
//};
var loopNode = function(selectorSpecifier, BindedDataMap, directive, element) {
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
			original: undefined,
			elementType: 'Variable'
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
					loopDirective.original = key;
					already = true;
				}
			}
		});
		
		map(directive[loopDirective.original], function(v) {
			var type = typeof v;
			if (type === 'object') {
				loopDirective.elementType = 'Array'
				return false;
			} else if (type === 'function') {
				// Function
				return true;
			} else if (type === 'string') {
				if (v.match('\\.')) {
					loopDirective.elementType = 'Object';
					return false;
				} else if (v !== "") {
					loopDirective.elementType = 'Variable';
					return false;
				}
			}
		});
		
		return loopDirective;
	};
	
	var loopDirective = parseLoopDirective(directive[selectorSpecifier.original]);
	if (exist(BindedDataMap[loopDirective.specification.itemName])) {
		error( 'identifier of loop variable is conflict' );
	} else {		
		var targetDirective = loopDirective.specification.arrayName;
		if (targetDirective.match('\\.')) {
			// Object
			var path = targetDirective.split('.');
			var key = path[0];
			var rootObjectBinderSet;
			
			var searchingResult = prefixSearch(BindedDataMap, path);
			var pPath = searchingResult.prefixPath;
			var rPath = searchingResult.restPath;
			
			// if (rPath.length === 0) then ArrayBinderSet exists
			var arrBinderSet = searchingResult.node;
			if ( rPath.length === 0 && arrBinderSet.hasTemplateBinderSet() ) {
				var templateBinderSet = arrBinderSet.getTemplateBinderSet();
				
				BindedDataMap.appendBinderSet(
					loopDirective.specification.itemName, templateBinderSet);
				
				parse(element, BindedDataMap,
					directive[selectorSpecifier.original][loopDirective.original]);
			} else {
				var templateBinderSet;
				if (loopDirective.elementType === 'Array') {
					templateBinderSet = createArrayBinderSet();
				} else if (loopDirective.elementType === 'Object') {
					templateBinderSet = createObjectBinderSet();
				} else if (loopDirective.elementType === 'Variable') {
					templateBinderSet = createBinderSet();
				}
				BindedDataMap.appendBinderSet(
					loopDirective.specification.itemName, templateBinderSet);
				
				parse(element, BindedDataMap,
					directive[selectorSpecifier.original][loopDirective.original]);
				
	//			if (pPath.length != 0 && rPath.length != 0) {
	//				searchingResult.node.appendBinderSet(rPath[0], binderSet);
	//				rootObjectBinderSet = BindedDataMap[pPath[0]];
	//			} else if (pPath.length == 0) {
	//				parent.appendBinderSet(path[path.length-1], binderSet);
	//				rootObjectBinderSet = BindedDataMap[key] = parent;
	//			} else if (rPath.length == 0) {
	//				rootObjectBinderSet = BindedDataMap[pPath[0]];
	//			}
				if ( rPath.length !== 0 ) {
					arrBinderSet = createArrayBinderSet();
					
//					var objBinderSet = createObjectBinderSet(rPath.slice(0, rPath.length));
//					prefixSearch(objBinderSet, rPath).node.appendBinderSet(rPath[rPath.length-1], arrBinderSet);
					var binderSet;
					if (rPath.length > 1) {
						binderSet = createObjectBinderSet(rPath.slice(0, rPath.length));
						prefixSearch(binderSet, rPath).node.appendBinderSet(rPath[rPath.length-1], arrBinderSet);
//						binderSet.appendBinderSet(rPath[rPath.length-1], arrBinderSet);
					} else if (rPath.length == 1) {
						binderSet = arrBinderSet;
					}
					
					if (pPath.length === 0) {
						BindedDataMap.appendBinderSet(rPath[0], binderSet);
					} else {
						searchingResult.node.appendBinderSet(rPath[0], binderSet);
					}
				}
				
				arrBinderSet.setTemplateBinderSet(BindedDataMap[loopDirective.specification.itemName]);
			}
			
			element.parentNode,
			
			".arrayTest li.people": {
				"person<-obj.people": {
					".id": "person.id",
					".who": "person.who",
					".obj": "person.obj.x",
					"li.team":{
						"teamMember<-person.team": {
							"a.who": "teamMember.who",
							"a.who@href": "teamMember.id"
						}
					}
				}
			}.removeChild(element);
			BindedDataMap.removeBinderSet(loopDirective.specification.itemName);
			delete BindedDataMap[loopDirective.specification.itemName];
			
			var array = readData(BindedDataMap, loopDirective.specification.arrayName);
			arrBinderSet(array);
		} else if (targetDirective !== "") {
			// Array Variable
			var arrBinderSet = BindedDataMap[targetDirective];
			if ( exist(arrBinderSet) && arrBinderSet.hasTemplateBinderSet() ) {
				var templateBinderSet = arrBinderSet.getTemplateBinderSet();
				
				BindedDataMap.appendBinderSet(
					loopDirective.specification.itemName, templateBinderSet);
				
				parse(element, BindedDataMap,
					directive[selectorSpecifier.original][loopDirective.original]);
			} else {
				var templateBinderSet;
				if (loopDirective.elementType === 'Array') {
					templateBinderSet = createArrayBinderSet();
				} else if (loopDirective.elementType === 'Object') {
					templateBinderSet = createObjectBinderSet();
				} else if (loopDirective.elementType === 'Variable') {
					templateBinderSet = createBinderSet();
				}
				BindedDataMap.appendBinderSet(
					loopDirective.specification.itemName, templateBinderSet);
				
				parse(element, BindedDataMap,
					directive[selectorSpecifier.original][loopDirective.original]);
				
				if ( !exist(arrBinderSet) ) {
					arrBinderSet = createArrayBinderSet();
					BindedDataMap.appendBinderSet(targetDirective, arrBinderSet);
				}
//				if ( exist(BindedDataMap[targetDirective]) ) {
//					arrBinderSet = BindedDataMap[targetDirective];
//				} else {
//					arrBinderSet = createArrayBinderSet();
//					BindedDataMap.appendBinderSet(targetDirective, arrBinderSet);
//				}
				arrBinderSet.setTemplateBinderSet(BindedDataMap[loopDirective.specification.itemName]);
			}
			
			element.parentNode.removeChild(element);
			BindedDataMap.removeBinderSet(loopDirective.specification.itemName);
			delete BindedDataMap[loopDirective.specification.itemName];
			
			var array = readData(BindedDataMap, loopDirective.specification.arrayName);
			arrBinderSet(array);
		}
	}
};


var parse = function(template, BindedDataMap, directive) {
	var processSelector = function(selectorSpecifier, directive, root) {
		var selector = selectorSpecifier.selector;
		var elements = (selector && selector !== '.') ? find(root, selector) : [root];
		
		if(elements.length === 0){
			error( 'The selector "' + selector + '" was not found in the template:\n' + root );
		}
		
		map(elements, function(element) {
			var targetDirective = directive[selector];
			var type = typeof targetDirective;
			
			if (type === 'object') {
				// Array
				loopNode(selectorSpecifier, BindedDataMap, directive, element);
			} else if (type === 'function') {
				// Function
				var action = function(value) {
					return getDomAction(selectorSpecifier, element)(targetDirective(value));
				};
				FunctionBinderList.push( createFunctionBinder(action) );
			} else if (type === 'string') {
				var action = getDomAction(selectorSpecifier, element);
				var binder = createBinder(action);
				
				if (targetDirective.match('\\.')) {
					// Object
					var path = targetDirective.split('.');
					var key = path[0];
					var rootObjectBinderSet;
					
					var searchingResult = prefixSearch(BindedDataMap, path);
					var pPath = searchingResult.prefixPath;
					var rPath = searchingResult.restPath;
					
					if (pPath.length != 0 && rPath.length != 0) {
						searchingResult.node.appendBinderSet(rPath[0], createObjectBinderSet(rPath));
						rootObjectBinderSet = BindedDataMap[pPath[0]];
					} else if (pPath.length == 0) {
						rootObjectBinderSet = createObjectBinderSet(path);
						BindedDataMap.appendBinderSet(key, rootObjectBinderSet);
					} else if (rPath.length == 0) {
						rootObjectBinderSet = BindedDataMap[pPath[0]];
					}
					
					rootObjectBinderSet.appendBinder(path, binder);
					rootObjectBinderSet( readData(BindedDataMap, key) );
				} else if (targetDirective !== "") {
					// Variable
					var binderSet;
					if ( exist(BindedDataMap[targetDirective]) ) {
						binderSet = BindedDataMap[targetDirective];
					} else {
						binderSet = createBinderSet();
						BindedDataMap.appendBinderSet(targetDirective, binderSet);
					}
					
					binderSet.appendBinder(binder);
					binderSet( readData(BindedDataMap, targetDirective) );
				}
			}
		});
	};
	
	
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

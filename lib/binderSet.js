var parseDataToBinderSet = function(data) {
	var parseArray = function(data) {
		var arrBinderSet = createArrayBinderSet();
		
		map(data, function(v, k) {
			var type = typeof v;
			
			if ( isArray(v) ) {
				arrBinderSet.appendBinderSet( parseArray(v) );
			} else if (type === 'object') {
				arrBinderSet.appendBinderSet( parseObject(v) );
			} else if (type !== 'function') {
				arrBinderSet.appendBinderSet( createBinderSet(v) );
			}
		});
		
		return arrBinderSet;
	};
	
	var parseObject = function(data) {
		var objBinderSet = createObjectBinderSet();
		
		map(data, function(v, k) {
			var type = typeof v;
			
			if ( isArray(v) ) {
				objBinderSet.appendBinderSet( k, parseArray(v) );
			} else if (type === 'object') {
				objBinderSet.appendBinderSet( k, parseObject(v) );
			} else if (type !== 'function') {
				objBinderSet.appendBinderSet( k, createBinderSet(v) );
			}
		});
		
		return objBinderSet;
	};
	

	if ( isArray(data) ) {
		return parseArray(data);
	} else if (typeof data === 'object') {
		return parseObject(data);
	} else {
		return createBinderSet(data);
	}
};



// -----------------------------------



var createBinderSet = function(initialValue) {
	var v = initialValue;
	
	var bSet = function(value) {
		if ( exist(value) ) {
			v = value;
			map(binders, function(b) { return b.set(v); });
			return bSet;
		} else {
			return v;
		}
	};
	
	bSet.isBinderSet = true;
	
	var binders = bSet.binders = [];
	
	bSet.appendBinder = function(binder) {
		(!exist(binder) || !binder.isBinder) && error("Not Binder was appended!");
		return binders.push(binder);
	};
	
	bSet.appendBinders = function(binders) {
		return map(binders, function(b) { return bSet.appendBinder(b); });
	};
	
	bSet.getElements = function() {
		return map(binders, function(b) { return b.getElement(); });
	};
	
	bSet.clone = function() {
		var cloneBinderSet = createBinderSet(bSet());
		map(binders, function(b) {
			var clone = b.appendCloneToParent();
			cloneBinderSet.appendBinder(clone);
		});
		return cloneBinderSet;
	};
	
	bSet.remove = function(index) {
		if ( 0 <= index && index < binders.length ) {
			binders[index].remove();
			binders.splice(index,1);
		}
	};
	
	bSet.removeAll = function() {
		while(binders.length > 0) {
			bSet.remove(0);
		}
	};
	
	return bSet;
};


var createObjectBinderSet = function(path) {
	var createOBSet = function() {
		var keys = [];
		
		var bSet = function(value) {
			if ( exist(value) ) {
				if (typeof value === 'object') {
					map(value, function(v,k) {
						if ( 0 <= keys.indexOf(k) ) {
							bSet[k](v);
						} else {
							bSet.appendBinderSet( k, parseDataToBinderSet(v) );
						}
					});
				}
				return value;
			} else {
				var obj = {};
				map(keys, function(key) {
					obj[key] = bSet[key]();
				});
				return obj;
			}
		};
		
		bSet.isBinderSet = true;
		
		bSet.appendBinder = function(path, binder) {
			(!exist(binder) || !binder.isBinder) && error("Not Binder was appended!");
			var node = bSet;
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
		
		bSet.getElements = function() {
			error("'getElements' is only supported for 'Variable' and 'Function'");
		};
		
		bSet.appendBinderSet = function(key, binderSet) {
			(!exist(binderSet) || !binderSet.isBinderSet) && error("Not BinderSet was appended!");
			bSet[key] = binderSet;
			keys.push(key);
		};
		
		bSet.removeBinderSet = function(key) {
			var index = keys.indexOf(key);
			if (0 <= index) {
				delete bSet[key];
				keys.splice(index,1);
			}
		};
		
		bSet.clone = function() {
			var cloneBinderSet = createObjectBinderSet();
			map(keys, function(key) {
				cloneBinderSet.appendBinderSet(key, bSet[key].clone());
			});
			return cloneBinderSet;
		};
		
		bSet.remove = function(key) {
			if ( 0 <= keys.indexOf(key) ) {
				bSet[key].removeAll();
				bSet.removeBinderSet(key);
			}
		};
		
		bSet.removeAll = function() {
			map(keys, function(key) {
				bSet.remove(key);
			});
		};
		
		return bSet;
	};
	
	
	if ( isArray(path) ) {
		if (1 < path.length) {
			var bSet = createOBSet();
			bSet.appendBinderSet(path[1], createObjectBinderSet(path.slice(1, path.length)));
			return bSet;
		} else {
			return createBinderSet();
		}
	} else {
		return createOBSet();
	}
};


var createArrayBinderSet = function() {
	var bSets = [];
	var templateBinderSetGenerators = [];
	
	
	var bSet = function(value) {
		if (typeof value === 'number') {
			var index = Math.ceil(Math.abs(value));
			return bSets[index];
		} else if ( isArray(value) ) {
			bSet.removeAll();
			map(value, function(v) {
				var childBSet = bSet.templateBinderSetGeneratable()
					? generateTemplateBinderSet()
					: parseDataToBinderSet(v);
				bSet.appendBinderSet(childBSet);
				childBSet(v);
			});
			return bSet;
		} else {
			return map(bSets, function(bSet) { return bSet(); });
		}
	};
	
	bSet.isBinderSet = true;
	
	
	bSet.templateBinderSetGeneratable = function() { return templateBinderSetGenerators.length > 0; };

	bSet.appendTemplateBinderSetGenerator = function(generator) {
		templateBinderSetGenerators.push(generator);
	};

	bSet.setTemplateBinderSetGenerators = function(tbsgs) {
		return templateBinderSetGenerators = tbsgs;
	};

	var generateTemplateBinderSet = function() {
		var tbset = undefined;
		map(templateBinderSetGenerators, function(generator) {
			tbset = generator(tbset);
		});
		return tbset;
	};
	
	bSet.getElements = function() {
		error("'getElements' is only supported for 'Variable' and 'Function'");
	};
	
	bSet.appendBinderSet = function(binderSet) {
		(!exist(binderSet) || !binderSet.isBinderSet) && error("Not BinderSet was appended!");
		return bSets.push(binderSet);
	};
	
	bSet.clone = function() {
		var cloneBinderSet = createArrayBinderSet();
		cloneBinderSet.setTemplateBinderSetGenerators(templateBinderSetGenerators);
		cloneBinderSet( bSet() );
		return cloneBinderSet;
	};
	
	
	bSet.remove = function(index) {
		if (0 <= index && index < bSets.length) {
			bSets[index].removeAll();
			bSets.splice(index,1);
		}
	};
	
	bSet.removeAll = function() {
		while(bSets.length > 0) {
			bSet.remove(0);
		}
	};
	
	bSet.push = function(arrayElementData) {
		var childBSet = bSet.templateBinderSetGeneratable()
			? generateTemplateBinderSet()
			: parseDataToBinderSet(arrayElementData);
		bSet.appendBinderSet(childBSet);
		childBSet(arrayElementData);
		
		return bSet;
	};
	
	return bSet;
};

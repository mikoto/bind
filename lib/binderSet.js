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
		if ( exist(binders[index]) ) {
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
				map(keys, function(key) {
					if ( value.hasOwnProperty(key) ) {
						bSet[key](value[key]);
					}
				});
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
			delete bSet[key];
			keys.splice(keys.indexOf(key), 1);
		};
		
		bSet.clone = function() {
			var cloneBinderSet = createObjectBinderSet();
			map(keys, function(key) {
				cloneBinderSet.appendBinderSet(key, bSet[key].clone());
			});
			return cloneBinderSet;
		};
		
		bSet.remove = function(key) {
			if ( exist(bSet[key]) ) {
				bSet[key].removeAll();
				bSet.removeBinderSet(key);
			}
		};
		
		bSet.removeAll = function() {
			map(keys, function(key) {
				bSet[key].remove();
				delete bSet[key];
			});
			keys = [];
		};
		
		return bSet;
	};
	
	
	if ( isArray(path) ) {
		if (path.length > 1) {
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
	var templateBinderSet = undefined;
	
	var bSet = function(value) {
		if (typeof value === 'number') {
			var index = Math.ceil(Math.abs(value));
			return bSets[index];
		} else if ( isArray(value) ) {
			bSet.removeAll();
			map(value, function(v) {
				var childBSet = bSet.hasTemplateBinderSet()
					? bSet.cloneChild()
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
	
	
	bSet.hasTemplateBinderSet = function() { return exist(templateBinderSet); };
	bSet.getTemplateBinderSet = function() { return templateBinderSet; };
	bSet.setTemplateBinderSet = function(tbset) {
		exist(tbset) && !tbset.isBinderSet && error("Not BinderSet was appended!");
		return templateBinderSet = tbset;
	};
	
	
	bSet.appendBinder = function(index, binder) {
		!binder.isBinder && error("Not Binder was appended!");
		index === 0 && templateBinderSet.appendBinder(binder);
		bSets[index].appendBinder(binder);
	};
	
	bSet.getElements = function() {
		error("'getElements' is only supported for 'Variable' and 'Function'");
	};
	
	bSet.appendBinderSet = function(binderSet) {
		!binderSet.isBinderSet && error("Not BinderSet was appended!");
		!exist(templateBinderSet) && (bSet.setTemplateBinderSet( binderSet.clone() ));
		return bSets.push(binderSet);
	};
	
	bSet.clone = function() {
		var cloneBinderSet = createArrayBinderSet();
		cloneBinderSet.setTemplateBinderSet(bSet.getTemplateBinderSet());
		cloneBinderSet( bSet() );
		return cloneBinderSet;
	};
	
	bSet.cloneChild = function() {
		return templateBinderSet.clone();
	};
	
	bSet.remove = function(index) {
		if ( exist(bSets[index]) ) {
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
		bSets.appendBinderSet(
			bSet.cloneChild()(arrayElementData)
		);
	};
	
	return bSet;
};

/*
var createArrayBinderSet = function() {
	var bSets = [];
	
	var bSet = function(value) {
		if (typeof value === 'number') {
			var index = Math.ceil(Math.abs(value));
			return bSets[index];
		} else if ( isArray(value) ) {
			bSet.removeAll();
			map(value, function(v) {
				var childBSet = (false ? generateChild : parseDataToBinderSet)(v);
				bSet.appendBinderSet(childBSet);
				childBSet(v);
			});
			return bSet;
		} else {
			return map(bSets, function(bSet) { return bSet(); });
		}
	};
	
	bSet.isBinderSet = true;
	
	
//	var BindedDataMap = undefined;
//	bSet.setBindedDataMap = function(bdm) {
//		exist(bdm) && !bdm.isBinderSet && error("Not BinderSet was setted!");
//		return BindedDataMap = bdm;
//	};
//	
//	var roots = [];
//	bSet.appendRoot = function(root) { return roots.push(root); };
//	bSet.removeRoot = function(index) { return roots.splice(index,1); }
	
	var generateChild = function(value) {
		
		
		return createBinderSet();
	};
	
	var seedBinderSets = [];
	bSet.existSeedBinderSet = function() { return seedBinderSets.length > 0; };
	bSet.appendSeedBinderSet = function(seedBinderSet) { return seedBinderSets.push(seedBinderSet); };
	bSet.removeSeedBinderSet = function(index) { return seedBinderSets.splice(index,1); };
//	bSet.childGeneratable = function() { return true; };//return exist(BindedDataMap) && roots.length > 0; };
//	bSet.getChildGenerator = function() { return childGenerator; };
//	bSet.setChildGenerator = function(generator) {
//		typeof generator === 'function' && error("Not BinderSet Generator was appended!");
//		return childGenerator = generator;
//	};
	
//	bSet.hasTemplateBinderSet = function() { return exist(templateBinderSet); };
//	bSet.getTemplateBinderSet = function() { return templateBinderSet; };
//	bSet.setTemplateBinderSet = function(tbset) {
//		exist(tbset) && !tbset.isBinderSet && error("Not BinderSet was appended!");
//		return templateBinderSet = tbset;
//	};
	
	
//	bSet.appendBinder = function(index, binder) {
//		!binder.isBinder && error("Not Binder was appended!");
//		index === 0 && templateBinderSet.appendBinder(binder);
//		bSets[index].appendBinder(binder);
//	};
	
	bSet.getElements = function() {
		error("'getElements' is only supported for 'Variable' and 'Function'");
	};
	
	bSet.appendBinderSet = function(binderSet) {
		(!exist(binderSet) || !binderSet.isBinderSet) && error("Not BinderSet was appended!");
//		!exist(templateBinderSet) && (bSet.setTemplateBinderSet( binderSet.clone() ));
		return bSets.push(binderSet);
	};
	
	bSet.clone = function() {
		var cloneBinderSet = createArrayBinderSet();
		cloneBinderSet.setTemplateBinderSet(bSet.getTemplateBinderSet());
		cloneBinderSet( bSet() );
		return cloneBinderSet;
	};
	
	bSet.cloneChild = function() {
		return templateBinderSet.clone();
	};
	
	bSet.remove = function(index) {
		if ( exist(bSets[index]) ) {
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
		bSets.appendBinderSet(
			bSet.cloneChild()(arrayElementData)
		);
	};
	
	return bSet;
};
*/

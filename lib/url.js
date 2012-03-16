$b.url = function(us) {
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
				!data.hasOwnProperty(k) && (data[k] = v);
			});
			return data;
		});
	};
	
	url.extendedBy = function(child) {
		return url.apply(function(data) {
			map(child, function(v,k) {
				data[k] = v;
			});
			return data;
		});
	};

	return url;
};
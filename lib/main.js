var $b = {};
var FunctionBinderList = [];
$b.render = function(templates, data, directive, bindCompleteHandler) {
	var load = function(handler) {
		var _templates = templates; templates = undefined;
		var _data = data; data = undefined;
		var _directive = directive; directive = undefined;
		
		var completeHandler = function() {
			// If Loading Templates, Data and Directive are completed
			if ( exist(templates) && exist(data) && exist(directive) ) {
				handler(templates, data, directive);
				
				if (typeof bindCompleteHandler === 'function') {
					bindCompleteHandler(bind);
				}
			}
		};
		
		
		// Loading Templates
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
		
		
		// Loading Data
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
		
		
		// Loading Directive
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
	
	
	var bind = {};
	
	load(function(templates, data, directive) {
		var eventManager = createEventManager();
		
		bind.data = parseDataToBinderSet(data, eventManager);
		bind.event = eventManager;
		bind.roots = templates;
		
		map(templates, function(template) {
			parse(template, bind.data, directive);
		});
		
		
		map(FunctionBinderList, function(fb) {
			fb.set(bind);
			fb.setEventHandler();
		});
		
		return bind;
	});
	
	
	return bind;
};

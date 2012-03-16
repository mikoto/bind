var createBinder = function(action) {
	var Binder = function(action) {
		var v = undefined;
		
		this.isBinder = true;
		
		this.get = function() {
			return v;
		};
		
		this.set = function(value, dispatchEvent) {
			v = action(value);
			exist(dispatchEvent) && dispatchEvent(
				'change',
				{
					from: this,
					data: data,
					binds: parentBindedDataMap || BindedDataMap
				}
			);
			return v;
		};
		
		var getElement = this.getElement = function() { return action.element; };
		
		var clone = this.clone = function() {
			return createBinder(action.clone());
		};
		
		var appendCloneToParent = this.appendCloneToParent = function() {
			var c = clone();
			action.parentNode.appendChild(c.getElement());
			return c;
		};
		
		var remove = this.remove = function() {
			var e = getElement();
			e.parentNode && e.parentNode.removeChild(e);
		};
	};
	
	return (new Binder(action));
};


var createFunctionBinder = function(f) {
	var b = createBinder(f);
	b.setEventHandler = function() {
		var handler = function(event) {
			(bs.get() !== f(event)) && bs.set(event);
		};
				
		EventManager.addEventListener('change', handler);
		EventManager.addEventListener('append', handler);
		EventManager.addEventListener('remove', handler);
	};
	
	return b;
};

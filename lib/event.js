var createEventManager = function() {
	var EventManager = {};
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
	
	return EventManager;
};

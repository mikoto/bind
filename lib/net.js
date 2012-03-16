/*
 * Net.get(url, succesHandler)
 * Net.post(url, successHandler, parameters)
 */
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

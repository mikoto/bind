var $b = {};


!function (){
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



  $b.render = function(templates, data, directive, bindCompleteHandler) {
    var FunctionBinderList = [];

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
            _templates.parent.appendChild(fragment);
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
      bind.functions = FunctionBinderList;

      map(templates, function(template) {
        parse(template, bind, directive);
      });
      bind.data(bind.data());

      map(bind.functions, function(fb) {
        fb.set(bind);
        fb.setEventHandler();
      });

      return bind;
    });

    return bind;
  };



  // -----------------------------------



  var isArray = Array.isArray ?
        function(o) {
          return Array.isArray(o);
        } : function(o) {
          return Object.prototype.toString.call(o) === "[object Array]";
        };

  var indexOf = function(array, v) {
    if (array.indexOf) {
      return array.indexOf(v);
    } else {
      for(var i=0; i<array.length; i++) {
        if(array[i] == v) {
          return i;
        }
      }
      return -1;
    }
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
    });
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
      // return error('You can test Bind standalone with: iPhone, FF3.5+, Safari4+ and IE8+\n\nTo run Bind on your browser, you need a JS library/framework with a CSS selector engine');
      return error('You can test Bind standalone with: iPhone, FF3.5+, Safari4+ and IE8+');
    }
  };



  // -----------------------------------



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
      };
      xhr.open(method, url);
      var ps = undefined;
      if (method === 'POST') {
        ps = [];
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



  // -----------------------------------



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



  // -----------------------------------



  var createAction = function(selectorSpecifier){// createAction(selectorSpecifier)(element, value);
    var attr = selectorSpecifier.attr;
    if (attr) {
      // Attribute Set Action
      var isStyle = (/^style$/i).test(attr);
      var stylePropExec = (/^style:(.+?)$/i).exec(attr);
      var isStyleProp = stylePropExec != null;
      var styleProp = isStyleProp ? stylePropExec[1] : null;
      var isClass = (/^class$/i).test(attr);
      var attrName = isClass ? 'className' : attr;
      var attrSet = isStyleProp ?
        function(element, value) {
          element.style[styleProp] = value;
        } :
      function(element, value) {
        if(!value && value !== 0){
          if (attrName in element && !isStyle) {
            try{
              element[attrName] = ''; //needed for IE to properly remove some attributes
            }catch(e){} //FF4 gives an error sometimes -> try/catch
          }
          //no more nodeType check since
          element.removeAttribute(attrName);
        }else{
          element.setAttribute(attrName, value);
        }
      };
      var get = isStyle ? function(e){
              return e.style.cssText;
            } : isStyleProp ? function(e) {
              return e.style[styleProp];
            } : isClass ? function(e){
              return e.className;
            } : function(e){
              return e.getAttribute(attr);
            };

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
        return function(element, value) { element.insertBefore(document.createTextNode(value), element.firstChild);   };
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

  // selectorSpecifier: selectorSpecifier or function(element, value)
  var createDomAction = function(selectorSpecifier, element) {
    var action = typeof selectorSpecifier === 'function' ? selectorSpecifier : createAction(selectorSpecifier);
    var f = function(value) {
      return action(element, value);
    };

    f.element = element;
    f.template = element.cloneNode(true);
    f.parentNode = element.parentNode;

    f.clone = function() {
      var action = createDomAction(selectorSpecifier, f.template.cloneNode(true));
      action.parentNode = f.parentNode;
      return action;
    };

    return f;
  };


  var readData = function(BoundDataMap, targetDirective) {
    if (typeof targetDirective === 'string') {
      if (targetDirective.match('\\.')) {
        var path = targetDirective.split('.');
        var v = BoundDataMap;
        var vs = map(path, function(key) {
          if (v.hasOwnProperty(key)) {
            v = v[key];
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
        return BoundDataMap[targetDirective]();
      }
    }
    return undefined;
  };


  var loopNode = function(selectorSpecifier, Binder, directive, element) {
    var BoundDataMap = Binder.data;

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
          loopDirective.elementType = 'Array';
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
    var itemName = loopDirective.specification.itemName;
    if (exist(BoundDataMap[itemName])) {
      error( 'identifier of loop variable is conflict' );
    } else {
      var binderSetGenerator = (function() {
        var templateBinderSet = undefined;

        var action = createDomAction(function(element, value) {
          exist(templateBinderSet)
            && BoundDataMap.appendBinderSet(itemName, templateBinderSet);

          parse(element, Binder,
                directive[selectorSpecifier.original][loopDirective.original]);

          templateBinderSet = BoundDataMap[itemName];
          templateBinderSet(value);

          BoundDataMap.removeBinderSet(itemName);

          return value;
        }, element);
        element.parentNode.removeChild(element);

        return function(extendedBinderSet) {
          templateBinderSet = extendedBinderSet;
          var f = action.clone();
          f();
          f.parentNode.appendChild(f.element);

          var rm = templateBinderSet.removeAll;
          templateBinderSet.removeAll = function() {
            rm();
            f.parentNode.removeChild(f.element);
          };

          return templateBinderSet;
        };
      })();

      var arrBinderSet = undefined;

      var targetDirective = loopDirective.specification.arrayName;
      if (targetDirective.match('\\.')) {
        // Object
        var path = targetDirective.split('.');
        var key = path[0];
        var rootObjectBinderSet;

        var searchingResult = prefixSearch(BoundDataMap, path);
        var pPath = searchingResult.prefixPath;
        var rPath = searchingResult.restPath;

        // if (rPath.length === 0) then ArrayBinderSet exists
        arrBinderSet = searchingResult.node;
        if ( rPath.length !== 0 ) {
          arrBinderSet = createArrayBinderSet(Binder.event);

          var binderSet;
          if (rPath.length > 1) {
            binderSet = createObjectBinderSet(rPath.slice(0, rPath.length), Binder.event);
            prefixSearch(binderSet, rPath).node.appendBinderSet(
              rPath[rPath.length-1],
              arrBinderSet
            );
          } else if (rPath.length == 1) {
            binderSet = arrBinderSet;
          }

          if (pPath.length === 0) {
            BoundDataMap.appendBinderSet(rPath[0], binderSet);
          } else {
            searchingResult.node.appendBinderSet(rPath[0], binderSet);
          }
        }
      } else if (targetDirective !== "") {
        // Variable
        arrBinderSet = BoundDataMap[targetDirective];
        if ( !exist(arrBinderSet) ) {
          arrBinderSet = createArrayBinderSet(Binder.event);
          BoundDataMap.appendBinderSet(targetDirective, arrBinderSet);
        }
      }

      arrBinderSet.appendTemplateBinderSetGenerator(binderSetGenerator);
    }
  };


  var parse = function(template, Binder, directive) {
    var BoundDataMap = Binder.data;

    var processSelector = function(selectorSpecifier, directive, root) {
      var selector = selectorSpecifier.selector;
      var elements = (selector && selector !== '.') ? find(root, selector) : [root];

      if(elements.length === 0){
        error( 'The selector "' + selector + '" was not found in the template:\n' + root );
      }

      map(elements, function(element) {
        var targetDirective = directive[selectorSpecifier.original];
        var type = typeof targetDirective;

        if (type === 'object') {
          // Array
          loopNode(selectorSpecifier, Binder, directive, element);
        } else if (type === 'function') {
          // Function
          var action = function(value) {
            return createDomAction(selectorSpecifier, element)(targetDirective(value));
          };
          Binder.functions.push( createFunctionBinder(action, Binder.event) );
        } else if (type === 'string') {
          var action = createDomAction(selectorSpecifier, element);
          var binder = createBinder(action);

          if (targetDirective.match('\\.')) {
            // Object
            var path = targetDirective.split('.');
            var key = path[0];
            var rootObjectBinderSet;

            var searchingResult = prefixSearch(BoundDataMap, path);
            var pPath = searchingResult.prefixPath;
            var rPath = searchingResult.restPath;

            if (pPath.length != 0 && rPath.length != 0) {
              searchingResult.node.appendBinderSet(rPath[0], createObjectBinderSet(rPath, Binder.event));
              rootObjectBinderSet = BoundDataMap[pPath[0]];
            } else if (pPath.length == 0) {
              rootObjectBinderSet = createObjectBinderSet(path, Binder.event);
              BoundDataMap.appendBinderSet(key, rootObjectBinderSet);
            } else if (rPath.length == 0) {
              rootObjectBinderSet = BoundDataMap[pPath[0]];
            }

            rootObjectBinderSet.appendBinder(path, binder);
          } else if (targetDirective !== "") {
            // Variable
            var binderSet;
            if ( exist(BoundDataMap[targetDirective]) ) {
              binderSet = BoundDataMap[targetDirective];
            } else {
              binderSet = createBinderSet(undefined, Binder.event);
              BoundDataMap.appendBinderSet(targetDirective, binderSet);
            }

            binderSet.appendBinder(binder);
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



  // -----------------------------------



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
            binds: parentBoundDataMap || BoundDataMap
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


  var createFunctionBinder = function(f, eventManager) {
    var b = createBinder(f);
    b.setEventHandler = function() {
      var handler = function(event) {
        (bs.get() !== f(event)) && bs.set(event);
      };

      eventManager.addEventListener('change', handler);
      eventManager.addEventListener('append', handler);
      eventManager.addEventListener('remove', handler);
    };

    return b;
  };



  // -----------------------------------



  var parseDataToBinderSet = function(data, eventManager) {
    var parseArray = function(data) {
      var arrBinderSet = createArrayBinderSet(eventManager);

      map(data, function(v, k) {
        var type = typeof v;

        if ( isArray(v) ) {
          arrBinderSet.appendBinderSet( parseArray(v) );
        } else if (type === 'object') {
          arrBinderSet.appendBinderSet( parseObject(v) );
        } else if (type !== 'function') {
          arrBinderSet.appendBinderSet( createBinderSet(v, eventManager) );
        }
      });

      return arrBinderSet;
    };

    var parseObject = function(data) {
      var objBinderSet = createObjectBinderSet(undefined, eventManager);

      map(data, function(v, k) {
        var type = typeof v;

        if ( isArray(v) ) {
          objBinderSet.appendBinderSet( k, parseArray(v) );
        } else if (type === 'object') {
          objBinderSet.appendBinderSet( k, parseObject(v) );
        } else if (type !== 'function') {
          objBinderSet.appendBinderSet( k, createBinderSet(v, eventManager) );
        }
      });

      return objBinderSet;
    };


    if ( isArray(data) ) {
      return parseArray(data);
    } else if (typeof data === 'object') {
      return parseObject(data);
    } else {
      return createBinderSet(data, eventManager);
    }
  };



  // -----------------------------------



  var createBinderSet = function(initialValue, eventManager) {
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
      var cloneBinderSet = createBinderSet(bSet(), eventManager);
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


  var createObjectBinderSet = function(path, eventManager) {
    var createOBSet = function() {
      var keys = [];

      var bSet = function(value) {
        if ( exist(value) ) {
          if (typeof value === 'object') {
            map(value, function(v,k) {
              if ( 0 <= indexOf(keys,k) ) {
                bSet[k](v);
              } else {
                bSet.appendBinderSet( k, parseDataToBinderSet(v, eventManager) );
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
            node = node[key];
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
        var index = indexOf(keys,key);
        if (0 <= index) {
          delete bSet[key];
          keys.splice(index,1);
        }
      };

      bSet.clone = function() {
        var cloneBinderSet = createObjectBinderSet(undefined, eventManager);
        map(keys, function(key) {
          cloneBinderSet.appendBinderSet(key, bSet[key].clone());
        });
        return cloneBinderSet;
      };

      bSet.remove = function(key) {
        if ( 0 <= indexOf(keys,key) ) {
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
        bSet.appendBinderSet(path[1], createObjectBinderSet(path.slice(1, path.length), eventManager));
        return bSet;
      } else {
        return createBinderSet(undefined, eventManager);
      }
    } else {
      return createOBSet();
    }
  };


  var createArrayBinderSet = function(eventManager) {
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
                : parseDataToBinderSet(v, eventManager);
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
      var cloneBinderSet = createArrayBinderSet(eventManager);
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
            : parseDataToBinderSet(arrayElementData, eventManager);
      bSet.appendBinderSet(childBSet);
      childBSet(arrayElementData);

      return bSet;
    };

    return bSet;
  };

}();

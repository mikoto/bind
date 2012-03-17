#Bind.js


__Bind.js__ is a Dynamic Template Engine by JavaScript.  
Model(JSON) is bound to View(HTML).  
Modifications of Model dynamically reflect View.


##Example

###Template

	<div id="template">
		<p id="selector">Initial Text</p>
	</div>
	

###Data

	var data = {
		"text": "First Bound Text"
	};


###Directive

	var directive = {
		"#selector": "text"
	};


###Render

A following code transforms Data(JSON) in Template(HTML).  
Additionally, you will get a bound data as "binds".

	var binds = $b.render(
		"#template",
		data,
		directive
	);

####Result of Rendering

	<div id="template">
		<p id="selector">First Bound Text</p>
	</div>


###Modify

    binds.text("Modified Text!");

####Result of Modification

	<div id="template">
		<p id="selector">Modified Text!</p>
	</div>


##Supported Types

__Bind.js__ supports following type as _Data_

- Primitive Types
- String
- Object
- Array


##References

__Bind.js__ references [__PURE__](http://beebole.com/pure/).  
For example, specifications of Directive are similar.
Please see this [document](http://beebole.com/pure/documentation/what-is-a-directive/) about Directive.

---

_Copyright &copy; 2012 Mikoto Okumura_

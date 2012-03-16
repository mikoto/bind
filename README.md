#Bind.js


__Bind.js__ is a Dynamic Template Engine by JavaScript.  
Model(JSON) is binder to View(HTML).  
Changes of Model dynamically reflect View.


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

A following code transforms the Data(JSON) in Template(HTML)  
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


###Change Model

    binds.text("Model is Changed");

####Result of Model Change

	<div id="template">
		<p id="selector">Model is Changed</p>
	</div>


##Supported Types

__Bind.js__ supports following type as _Data_

- Primitive Types
- String
- Object
- Array

---

_Copyright &copy; 2012 Mikoto Okumura_
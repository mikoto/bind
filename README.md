# Bind.js


__Bind.js__ is a Light Dynamic Template Engine(Template Processor) by JavaScript.  
Model(JSON) is bound to View(HTML).  
Modifications of Model dynamically reflect View.

You can use this library by only including [bind.js](https://github.com/mikoto/bind/blob/master/lib/bind.js).

## Examples

### 1. The Simplest Example

#### 1.1 Inputs

__Bind.js__ needs three inputs: ___Template___, ___Data___ and ___Directive___.

___Template___ is View.  
It is written in _pure_ HTML.

___Data___ is written in JSON.  
__Binds.js__ parse a JSON and generate a Model.  
Model in __Bind.js__ has setter and getter. __1.3 Modification__ and __1.4 Reading__ are the examples of them.

___Directive___ is a assignment Rule.  
It describes wchich model is buond to where of DOM.

__Bind.js__ allows to separate Designer's work, Server side engineer's one and Client side engineer's one.  
___Template___ is a Designer's work.  
___Data___ is a Server side engineer's work.  
___Directive___ is a Client side engineer's work.

Followings are sample codes of inputs.

___Template___

	<div id="template">
		<p id="selector">Initial Text</p>
	</div>


___Data___

	var data = {
		"text": "First Bound Text"
	};


___Directive___

	var directive = {
		"#selector": "text"
	};


#### 1.2 Rendering

A following code transforms Data(JSON) in Template(HTML).  
Additionally, you will get a bound data as "binds".

___Code___

	var binds = $b.render(
		"#template",
		data,
		directive
	);

___Result of Rendering___

	<div id="template">
		<p id="selector">First Bound Text</p>
	</div>


#### 1.3 Modification (setter)

Modifications of Model dynamically reflrect View.

___Code___

    binds.data.text("Modified Text!");

___Result of Modification___

	<div id="template">
		<p id="selector">Modified Text!</p>
	</div>


#### 1.4 Reading (getter)

    binds.data.text();  // "Modified Text!" is returned


---

### 2. Array Example

This Example is included in this project.  
Please check [examples/array](https://github.com/mikoto/bind/tree/master/examples/array).


#### 2.1 Inputs

___Template___

	<ul id="comments">
        <li>
            <p class="body">Comment</p>
            <p class="author">Posted by <span>Author</span></p>
        </li>
    </ul>


___Data___

	var data = {
    	"comments": [
    		{
    			"body": "Comment Test0",
    			"author": "Mikoto Okumura"
    		},
    		{
    			"body": "Comment Test1",
    			"author": "Taro Tanaka"
    		},
    		{
    			"body": "Comment Test2",
    			"author": "Hanako Suzuki"
    		}
    	]
    };


___Directive___

__Bind.js__ supports a loop directive.

	var directive = {	
        "li":{
            "comment<-comments":{
                ".body": "comment.body",
                ".author span": "comment.author"
            }
        }
    };


#### 2.2 Rendering

___Code___

	var binds = $b.render(
		"#comments",
		data,
		directive
	);

___Result of Rendering___

	<ul id="comments">
        <li>
            <p class="body">Comment Test0</p>
            <p class="author">Posted by <span>Mikoto Okumura</span></p>
        </li>
        <li>
            <p class="body">Comment Test1</p>
            <p class="author">Posted by <span>Taro Tanaka</span></p>
        </li>
        <li>
            <p class="body">Comment Test2</p>
            <p class="author">Posted by <span>Hanako Suzuki</span></p>
        </li>
    </ul>


#### 2.4 Pushing New Comment Data

___Code___

    binds.data.comments.push(
        {
            body: "New Comment",
            author: "Guest"
        }
    );

___Result of Pushing___

	<ul id="comments">
        <li>
            <p class="body">Comment Test0</p>
            <p class="author">Posted by <span>Mikoto Okumura</span></p>
        </li>
        <li>
            <p class="body">Comment Test1</p>
            <p class="author">Posted by <span>Taro Tanaka</span></p>
        </li>
        <li>
            <p class="body">Comment Test2</p>
            <p class="author">Posted by <span>Hanako Suzuki</span></p>
        </li>
        <li>
            <p class="body">New Comment</p>
            <p class="author">Posted by <span>Guest</span></p>
        </li>
    </ul>


#### 2.5 Removing Data

Array Model supports _remove(index)_ method which removes an element specified index.

___Code___

    var length = binds.data.comments().length;
    binds.data.comments.remove(length-1); // last element and DOM is removed.

___Result of Pushing___

	<ul id="comments">
        <li>
            <p class="body">Comment Test0</p>
            <p class="author">Posted by <span>Mikoto Okumura</span></p>
        </li>
        <li>
            <p class="body">Comment Test1</p>
            <p class="author">Posted by <span>Taro Tanaka</span></p>
        </li>
        <li>
            <p class="body">Comment Test2</p>
            <p class="author">Posted by <span>Hanako Suzuki</span></p>
        </li>
        <li>
            <p class="body">New Comment</p>
            <p class="author">Posted by <span>Guest</span></p>
        </li>
    </ul>


#### 2.6 Reading

___Array Getter___

    binds.data.comments(); // A whole array is returned. It is just an array not Model.

___Element in Array Getter___

    var e1 = binds.data.comments(1); // An element indexed by 1 is returned. It is a Model.
    e1(); // {body: "Comment Test0", author: "Taro"} is returned. It is just an Object.
    e1({body: "Modified Commet"}); // body property is modified. Ofcourse, DOM is modified too.


#### 2.7 Reseting Data

Array Model has a getter which accepts array data.

    binds.data.comments(data); // data is an original data which is passed to a render function.



### 3. Object Example

#### 3.1 Inputs

___Template___

	<div id="template">
		<p id="selector">Initial Text</p>
	</div>


___Data___

	var data = {
		"obj" {
            "x": "This is obj.x",
            "y": "This is obj.y"
        }
	};


___Directive___

	var directive = {
		"#selector1": "obj.x",
		"#selector2": "obj.y"
	};


#### 3.2 Rendering

A following code transforms Data(JSON) in Template(HTML).  
Additionally, you will get a bound data as "binds".

___Code___

	var binds = $b.render(
		"#template",
		data,
		directive
	);

___Result of Rendering___

	<div id="template">
		<p id="selector1">This is a obj.x</p>
		<p id="selector2">This is a obj.y</p>
	</div>


#### 3.3 Modification

___Object Model Like Object___

Object Model _obj_ has a child _x_ (and _y_).

    binds.data.obj.x("Modified Text!");  // obj.x is modified.

___Object Setter___

Object Model _obj_ has a child _x_ (and _y_).

    binds.data.obj({x: "Modified Text!"});  // Only obj.x is modified. obj.y does not effected.


#### 3.4 Reading (getter)

    binds.data.obj();  // An Object is returned. It is just an Object not Model.
    binds.data.obj.y() // "This is a obj.y" is returned.



##Supporting Types

__Bind.js__ supports following type as ___Data___

* Primitive Types
* String
* Object
* Array


__Bind.js__ supports following ___Directives___

* Plain i.e) "x"
* Object Path i.e) "obj.x"
* Loop i.e) "x<-xs"
* Function i.e) function(binder) { ... }


##References

__Bind.js__ references [__PURE__](http://beebole.com/pure/).  
For example, specifications of Directive are similar.
Please see this [document](http://beebole.com/pure/documentation/what-is-a-directive/) about Directive.

---

&copy; _2013 Mikoto Okumura_

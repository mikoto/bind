#Bind.js


__Bind.js__ is a Dynamic Template Engine by JavaScript.  
Model(JSON) is bound to View(HTML).  
Modifications of Model dynamically reflect View.

You can use this library by only including [bind.js](https://github.com/mikoto/bind/blob/master/lib/bind.js).

##Examples

###The Simplest Example

####Template

	<div id="template">
		<p id="selector">Initial Text</p>
	</div>
	

####Data

	var data = {
		"text": "First Bound Text"
	};


####Directive

	var directive = {
		"#selector": "text"
	};


####Render

A following code transforms Data(JSON) in Template(HTML).  
Additionally, you will get a bound data as "binds".

	var binds = $b.render(
		"#template",
		data,
		directive
	);

#####Result of Rendering

	<div id="template">
		<p id="selector">First Bound Text</p>
	</div>


####Modify

    binds.data.text("Modified Text!");

#####Result of Modification

	<div id="template">
		<p id="selector">Modified Text!</p>
	</div>

---

###Array Example

This Example is included in this project.  
Please check [examples/array](https://github.com/mikoto/bind/tree/master/examples/array).


####Template

	<ul id="comments">
        <li>
            <p class="body">Comment</p>
            <p class="author">Posted by <span>Author</span></p>
        </li>
    </ul>
	

####Data

	var data = {
    	"comments": [
    		{
    			"body": "Comment Test1",
    			"author": "Mikoto Okumura"
    		},
    		{
    			"body": "Comment Test2",
    			"author": "Taro Tanaka"
    		},
    		{
    			"body": "Comment Test3",
    			"author": "Hanako Suzuki"
    		}
    	]
    };


####Directive

	var directive = {	
        "li":{
            "comment<-comments":{
                ".body": "comment.body",
                ".author span": "comment.author"
            }
        }
    };


####Render

	var binds = $b.render(
		"#comments",
		data,
		directive
	);

#####Result of Rendering

	<ul id="comments">
        <li>
            <p class="body">Comment Test1</p>
            <p class="author">Posted by <span>Mikoto Okumura</span></p>
        </li>
        <li>
            <p class="body">Comment Test2</p>
            <p class="author">Posted by <span>Taro Tanaka</span></p>
        </li>
        <li>
            <p class="body">Comment Test3</p>
            <p class="author">Posted by <span>Hanako Suzuki</span></p>
        </li>
    </ul>


####Push New Comment Data

    binds.data.comments.push(
        {
            body: "New Comment",
            author: "Guest"
        }
    );

#####Result of Pushing

	<ul id="comments">
        <li>
            <p class="body">Comment Test1</p>
            <p class="author">Posted by <span>Mikoto Okumura</span></p>
        </li>
        <li>
            <p class="body">Comment Test2</p>
            <p class="author">Posted by <span>Taro Tanaka</span></p>
        </li>
        <li>
            <p class="body">Comment Test3</p>
            <p class="author">Posted by <span>Hanako Suzuki</span></p>
        </li>
        <li>
            <p class="body">New Comment</p>
            <p class="author">Posted by <span>Guest</span></p>
        </li>
    </ul>


##Supported Types

__Bind.js__ supports following type as _Data_

* Primitive Types
* String
* Object
* Array


##References

__Bind.js__ references [__PURE__](http://beebole.com/pure/).  
For example, specifications of Directive are similar.
Please see this [document](http://beebole.com/pure/documentation/what-is-a-directive/) about Directive.

---

_Copyright &copy; 2012 Mikoto Okumura_

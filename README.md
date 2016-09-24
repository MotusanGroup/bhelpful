# bhelpful
Condition-based context-sensitive help

A step up from mapping element selectors to help content, this adds the ability to test if the selected element contains content (or more more advanced condition checking). So you can display different content depending on the state.

Add it to your project like this:

	// configure it
	var instance = Bhelpful({
		debug : true,
		locale : locale,
		onInitialized : function(resources){
			console.log('Got help resources: ');
			console.dir(resources);
		}
	});
		
	// initialize it
	instance.initialize();

By default, it will try to resolve help resources with a GET request to '/resources/{locale}/help.js'. (Customize base URL by adding resourcesBase option.)

Help resources file should look something like this:
  
	(function(){
		instance.createRenderers({
			"item key 1" : {
				"selector": "#element1",
				"help": {
				      "text" : "This is element1."
				}
		      	},
		      	"item key 2" : {
		      		"selector": "#element2",
		      		"help": [{
		      			"if" : [ "isNotEmpty" ],
		      			"text" : "These are your items in element2. Drag and drop them to add them."
		      		},
		      		{
		      			"if" : [ "isEmpty" ],
		      			"text" : "You don't have any items in element2 yet. Click New to create one."
		      		}]
		      	}
		});
  	}();


Planned features: 
* pluggable renderers (currently depends on jQuery and jQuery.balloon (https://urin.github.io/jquery.balloon.js/))


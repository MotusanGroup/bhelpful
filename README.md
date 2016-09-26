# bhelpful
Condition-based context-sensitive help

A step up from mapping element selectors to help content, this adds the ability to test if the selected element contains content (or more advanced condition checking). So you can display different content depending on the state.

## Setting it up
Add it to your web app like this:

	// Instantiate it. 
	var instance = Bhelpful();
	
	/* optionally pass in an options object like this (these are the defaults):
	 * {
	 *	debug : false,
	 *	resourcesBase : '/resources',
	 *	locale : 'en-us',
	 *	providerName : 'help.js',
	 *	cssPrefix : 'bhlp-',
	 *	onInitialized : function(resources) { console.dir(resources); },
	 *	defaultRenderer : function(resource) { /* renderer init */ } 
	 * }
	 */
		
	// Initialize it
	instance.initialize();

By default, it will try to fetch help resources by sending a GET request to '{resourcesBase}/{locale}/{providerName}' (/resources/en-us/help.js).

## Help resources
This is where you map your help content to your web app's page elements. Your help resources file should look something like the following. (Note that this is NOT JSON. It's an anonymous Javascript function (necessary to support inclusion of custom conditions and renderers). It must call the createRenderers method on the Bhelpful instance.)
  
	(function(){
		// call the createRenderers method on the instance you created
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
		      	},
		      	"item key 3" : {
		      		"selector": "#element3",
		      		"help": [{
		      			"if": [ function(context){
		      					return jQuery(context.selector).length > 3;
		      			},
		      			"text' : "You already got more than 3 items there. Do you still need help??"
		      		},
		      		{
		      			"if": [ function(context){
		      					return jQuery(context.selector).length <= 3;
		      			},
		      			"text' : "You probably want to add at least 3 items here."
		      		},
		      		
		});
  	}();

The object passed to createRenderers is a map of your context-sensitive help content. The item keys can be whatever you want. (Only requirement is that they're unique.) Each key points to an object that contains:
* selector: the CSS/jQuery selector that identifies the element(s) that will trigger context-sensitive help
* help: an object that contains 1) the help text to display when triggered and 2) any conditions you want to check before displaying (optional)

## Conditions
Conditions are what make Bhelpful so helpful. Most context-sensitive help is only nominally context-aware. You can specify conditions to check the state of the UI in real time to decide what help text to display.

For example, your page contains a select (list box) element with ID "list". This list is populated dynamically, and the number of items may vary. You want to show a different message depending on whether there are items in that list.

	"item key 2" : {
		"selector": "#list",
		"help": [{
			"if" : [ "isNotEmpty" ],
			"text" : "There are items in your list. Select one and click OK to launch."
		},
		{
			"if" : [ "isEmpty" ],
			"text" : "There are no items in your list yet. Click New to add one."
		}]
	}
	
There are some pre-defined conditions you can use out-of-the box:
* isEmpty (the selected element(s) is/are empty)
* isNotEmpty (the selected element(s) is/are not empty)
* isSelected (the selected radio button(s)/checkbox(es) is/are selected)
* isNotSelected (the selected radio button(s)/checkbox(es) is/are not selected)

Just add the name to the help item's "if" array. (Note that if there are multiple help items with true conditions mapped to the same selector, their text will be merged.)

But you can also create your own conditions. Just add an anonymous function to the "if" array. The function should return true if you want the help text to be displayed. The function takes one argument, an object that contains the selector, the window, and the document.

	"item key 2" : {
		"selector": "input#firstName",
		"help": [{
			"if" : [ function(context){
				return jQuery(context.selector).val().indexOf('viagra') > -1;
			} ],
			"text" : "No thanks. We don't need that here."
		}]
	}

## Remote content
You can include remote content. Instead of setting the text property, set a url and (optionally) the method and parameters.

	"Some Feature" : {
			"selector" : "#featureDiv",
			"help" : [
				{
					"url": "https://example.org/helpfulsystem/help.php",
					"method": "GET",
					"data": {
						"topic":"someFeature",
						"randomParam":"something"
					}
				}
			]
		}

## Alternative renderers
Out of the box, Bhelpful displays a help balloon for a couple seconds when the mouse moves over elements matching the selector. (This implementation depends on jQuery and jQuery.balloon (https://urin.github.io/jquery.balloon.js/))

You may want a different behavior and/or look and feel. You can specify a defaultRenderer in the options you pass to the constructor, and this will be used as the default for rendering all your resources. You can also override this on individual resources.

A renderer is a function that specifies how the help is fetched and displayed for a given resource. It takes a resource as an argument. The implementation can access this.getFilteredContent to apply the conditions and retrieve the resulting text to display as specified in the help resources file, but this is not required.

For example, the following renderer function displays the browser's alert box when the mouse hovers over elements matching the selector.

	function(resource){
		var self = this;
		var context = {
			selector : resource.selector,
			document : document,
			window : window
		};

		jQuery('body').on('mouseover', resource.selector, function(ev){
			self.getFilteredContent(resource, context)
			.then(function(helpText){
				alert(helpText);
			});
		});
	}

If you want all your help targets to be rendered this way, set defaultRenderer to this function during initialization. 

If you only want to use this for a specific resource, assign it that resource as follows:

	"Some Feature" : {
		"selector" : "#featureDiv",
		"help" : [
			{
				"url": "https://example.org/helpfulsystem/help.php",
				"method": "GET",
				"data": {
					"topic":"someFeature",
					"randomParam":"something"
				}
			}
		],
		"renderer" : function(resource){
			var self = this;
			var context = {
				selector : resource.selector,
				document : document,
				window : window
			};

			jQuery('body').on('mouseover', resource.selector, function(ev){
				self.getFilteredContent(resource, context)
				.then(function(helpText){
					alert(helpText);
				});
			});
		}
	}
	
## The API

There's not much here. There are three public members on the Bhelpful instance:
* *initialize* : fetches help resources and calls the initialized callback when complete. Generally, this is only called once to initialize the help.
* *createRenderers* : called from the anonymous function in the help resources file. It takes the help resources object and invokes the renderers for each help resource. Generally, this is only called once to initialize the help.
* *getFilteredContent* : this method takes a help resource and a context as arguments and returns a Promise that resolves to the content that will be displayed for that resource. The context specifies any values that may be needed when evaluating the conditions. First, for each help item, each condition in the if array is evaluated. If any conditions on a help item fail, the content of that item will not be rendered. If all conditions pass, it will check for either a text or a url property and retrieve the content accordingly. (If both are present, text is used.) Finally, all text for all help items whose conditions passed is merged into a single help text.

## Planned features 
* pluggable content resolvers (Currently can read text strings in the help resources file and from unprotected urls. Need to be able to support more sophisticated scenarios, e.g. paywalled content or content requiring authentication, etc.)
* pre-defined pluggable renderers (Currently only supports jqBalloon. Need to be able to support other rendering mechanisms out-of-the-box.)


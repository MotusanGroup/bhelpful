# bhelpful
Condition-based context-sensitive help

A step up from mapping element selectors to help content, this adds the ability to test if the selected element contains content (or more more advanced condition checking). So you can display different content depending on the state.

## Setting it up
Add it to your web app like this:

	/* Instantiate it. optionally pass in an options object like this (these are the defaults):
	 * {
	 *	debug : false,
	 *	resourcesBase : '/resources',
	 *	locale : 'en-us',
	 *	providerName : 'help.js',
	 *	cssPrefix : 'bhlp-',
	 *	onInitialized : function(resources) { console.dir(resources); }
	 * }
	 */
	var instance = Bhelpful();
		
	// Initialize it
	instance.initialize();

By default, it will try to fetch help resources by sending a GET request to '{resourcesBase}/{locale}/{providerName}' (/resources/en-us/help.js).

## Help resources
This is where you map your help content to your web app's page elements. Your help resources file should look something like the following. (Note that this is NOT JSON. It's an anonymous Javascript function (necessary to support inclusion of custom conditions). It must call the createRenderers method on the Bhelpful instance.)
  
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


## Planned features 
* pluggable content resolvers (currently can read text strings in the help resources file and from unprotected urls. Need to be able to support more sophisticated scenarios, e.g. paywalled content or content requiring authentication, etc.)
* pluggable renderers (currently depends on jQuery and jQuery.balloon (https://urin.github.io/jquery.balloon.js/). Need to be able to support other rendering mechanisms.)


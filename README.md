# bhelpful
Condition-based context-sensitive help

A step up from mapping element selectors to help content, this adds the ability to test if the selected element contains content (or more more advanced condition checking). So you can display different content depending on the state.

Add it to your project like this:

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

By default, it will try to fetch help resources with a GET request to '{resourcesBase}/{locale}/{providerName}' (/resources/en-us/help.js).

Your help resources file should look something like this:
  
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

Conditions are what make Bhelpful so helpful. Most context-sensitive help is only nominally context-aware. Conditions allow you to examine the state of the UI before deciding what help text to display.

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

Planned features: 
* pluggable content resolvers (currently can only read text strings from the help resouces file, need to resolve from urls)
* pluggable renderers (currently depends on jQuery and jQuery.balloon (https://urin.github.io/jquery.balloon.js/))


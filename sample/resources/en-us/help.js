(function(){
	// specify a function that exists on the Bhelpful instance you created
	instance.createRenderers({
			/*
			An example of the most simple case: a css selector mapped to a string of text.
			*/
		"key 1" : {
			"selector": "table#item1",
			"help": {
				"text" : "These are your injects. Drag and drop them on the MSEL to add them to your scenario."
			}
		},
		"key 2" : {
			/*
			An example using the pre-defined conditions. The selector matches a table of dynamic content,
			i.e., it may or may not contain rows. Show different help depending on whether there are rows.
			*/
			"selector": "table#item2",
			"help": [{
				"if" : [ "isNotEmpty" ],
				"text" : "These are your resources. Drag and drop them on a POD's resource window to add them to that POD's resources."
			},
			{
				"if" : [ "isEmpty" ],
				"text" : "These are your resources. You don't have any yet. Click New Resource to create one."
			}]
		},

		"key 3" : {
			/*
			An example resource using a custom condition (anonymous function returns true if
			the input field contains a specific string of text). The context parameter contains
			the selector and the document object.
			*/
			"selector": "input#item3",
			"help": [
				{
					"if": [ function(context){
						return jQuery(context.selector).val()=='paul';
					}],
					"text": "You won't find him here!"
				},
				{
					"if": [ function(context){
						return jQuery(context.selector).val()!='paul';
					}],
					"text": "Search for resources and stuff!"
				}
			]
		}
	});
})();

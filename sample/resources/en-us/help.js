{
	"Inject Library" : {
		"selector": "#injectLibraryTable",
		"help": [{
			"if" : [ "isNotEmpty" ],
			"text" : "These are your injects. Drag and drop them on the MSEL to add them to your scenario."
		},
		{
			"if" : [ "isEmpty" ],
			"text" : "These are your injects. You don't have any yet. Click New Inject to create one."
		}]
	},
	"Resource Library" : {
		"selector": "#resourceLibraryTable",
		"help": [{
			"if" : [ "isNotEmpty" ],
			"text" : "These are your resources. Drag and drop them on a POD's resource window to add them to that POD's resources."
		},
		{
			"if" : [ "isEmpty" ],
			"text" : "These are your resources. You don't have any yet. Click New Resource to create one."
		}]
	}
}

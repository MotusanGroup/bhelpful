/* ===================================
 * =			Bhelpful			 =
 * =								 =
 * =================================== */

 /**
 The structure of the help map is:
 (function(){
 	// specify a function that exists on the Bhelpful instance you created
 	<bhelpfulInstance>.createRenderers({
		 <keyName> : {
			 "selector": <cssSelector>,
			 "help": {
			 	"if" : [
					<conditions>
				],
			 	"text" : <helpTextString> | "url" : <contentSourceUrl>
			}
		 }
	 });

 Conditions can be:
 	* one of these pre-defined functions:
		- isEmpty (the element specified in the selector has no content)
		- isNotEmpty (the element specified in the selector has content, visible or otherwise)
		- isSelected (the checkbox/radio button element specified in the selector is selected)
		- isNotSelected (the checkbox/radio button element specified in the selector is not selected)
 	* anonymous functions that return true:
		function(){
			return jQuery('input#firstName').val()=='Paul';
		}
	}
 */

 /* opts : { cssPrefix, resourcesBase, locale, onInitialized, debug } */
var Bhelpful = (function(opts){
	var LOG_PREFIX = 'BHELPFUL: ';
	var options = opts || {};
	var CSS_PREFIX = options.cssPrefix || 'bhlp-';
	var debugEnabled = options.debug || false;
	var providerName = options.providerName || 'help.js';
	var resourcesBase = options.resourcesBase || '/resources';
	var locale = options.locale || 'en-us';
	var initializedCallback = typeof options.onInitialized == 'function' ?
			options.onInitialized : function(resources){
				debug('Bhelpful initialized');
				debug(resources);
			};

	// ----------------------------------------------------------------------------
	var predefinedConditions = {
		isEmpty : function(context){
			return jQuery(context.selector).html().length === 0;
		},
		isNotEmpty : function(context){
			return jQuery(context.selector).html().length > 0;
		},
		isSelected : function(context){
			return jQuery(context.selector).prop('checked');
		},
		isNotSelected : function(context){
			return !jQuery(context.selector).prop('checked');
		}
	};

	// ----------------------------------------------------------------------------
	var log = function(msg){ console[typeof msg == 'object'? 'dir' : 'log'](LOG_PREFIX + msg); };

	// ----------------------------------------------------------------------------
	var error = function(msg){ console.error(LOG_PREFIX + (typeof msg == 'object'? JSON.stringify(msg) : msg)); };

	// ----------------------------------------------------------------------------
	var debug = !debugEnabled ? function(){ } : function(msg){ log(msg); };

	// ----------------------------------------------------------------------------
	var initialize = function(){
		loadResources()
		.then(function(resources){
			initializedCallback(resources);
		})
		.catch(function(err){
			error(err);
		});
	};
	// ----------------------------------------------------------------------------
	var loadResources = function(){
		var p = new Promise(function(resolve, reject){
			var url = resourcesBase + '/' + locale + '/' + providerName;
			jQuery.getScript(url)
			.done(function(resources, textStatus){
				debug(textStatus);
				resolve(resources);
			})
			.fail(function(jqxhr, settings, ex){
				reject(ex);
			});
		});
		return p;
	};

	// ----------------------------------------------------------------------------
	var createRenderers = function(resources){
		for(var keyName in resources){
			if(!resources.hasOwnProperty(keyName)){
				continue;
			}
			var resource = resources[keyName];
			var selector = resource.selector;
			var help = resource.help;

			debug('createRenderers: create for resource "' + keyName + '"');
			if(!selector){
				error('Resource missing selector: ' + JSON.stringify(resource));
				continue;
			}

			if(!help){
				error('Resource missing help: ' + JSON.stringify(resource));
				continue;
			}

			var rendererConfig = {
				position : 'top',
				tipSize : 15,
				classname : CSS_PREFIX + 'quickhelp',
				delay : 3,
				minLifetime: 200,
				maxLifetime: 3000,
			};
			createRenderer(resource, rendererConfig);
		}
	};

	// ----------------------------------------------------------------------------
	var testConditions = function(helpItems, context){
		// merge all help items whose conditions pass (return true)
		var mergedText = '';
		var promises = [];

		var p = new Promise(function(resolve, reject){
			helpItems.forEach(function(helpItem){
				if(!helpItem.if || !helpItem.if.length){
					promises.push(getContent(helpItem));
				}
				else{
					// test each condition and AND them
					var conditions = helpItem.if;
					for(var i=0; i<conditions.length; i++){
						var cond = conditions[i];
						if(typeof predefinedConditions[cond] == 'function'){
							if(!predefinedConditions[cond](context)){
								return;
							}
						}
						else if(typeof cond == 'function'){
							if(!cond(context)){
								return;
							}
						}
						else{
							reject('testConditions: invalid condition: ' + JSON.stringify(cond));
						}
					}
					promises.push(getContent(helpItem));
				}
			});

			Promise.all(promises)
			.then(function(helpTexts){
				helpTexts.forEach(function(helpText){
					mergedText += ' ' + helpText;
				});
				resolve(mergedText);
			});
		});
		return p;
	};

	// ----------------------------------------------------------------------------
	/* TODO: make help render pluggable and try to genericize this */
	var createRenderer = function(resource, rendererConfig){
		var selector = resource.selector;
		var helpItems = resource.help;

		var shown = false;
		jQuery('body').on('mouseenter', selector, function(){
			var element = jQuery(this);
			if(shown){
				element.hideBalloon();
			}
			else{
				var context = {
					selector : selector,
					document : document,
					window : window
				};

				testConditions(helpItems, context)
				.then(function(helpText){
					rendererConfig.contents = helpText;
					if(helpText.length > 0){
						element.showBalloon(rendererConfig);
					}
				});
			}
			shown = !shown;
		});
	};

	// ----------------------------------------------------------------------------
	/*
	 * For larger, richer content (images, videos, HTML)
	 */
	var modalHelp = function(selector, conditions, contentInfo){
		var dlg = jQuery('#' + CSS_PREFIX + 'modalhelp');

		dlg.on('hidden.bs.modal', function(e) {
			//dlg.off('click', '.modal-header button.close');

			// if there were helper balloons, remove them too
			jQuery('.help-helpers').remove();
		});

		getContent(contentInfo, function(content){
			dlg.find('.modal-body').html(content);
			dlg.modal({
				backdrop : 'static'
			});
			dlg.modal('show');
		});
		return dlg;
	};

	// ----------------------------------------------------------------------------
	/*
	 * Passed content could be either a string or an object.
	 * An object will contain a url and other contextual information
	 * (locale, element ID) that may be used to resolve the help content
	 */
	var getContent = function(contentInfo){
		if(contentInfo.url){
			return getUrlContent(contentInfo);
		}
		else{
			return getLocalContent(contentInfo);
		}
	};

	// ----------------------------------------------------------------------------
	 getUrlContent = function(contentInfo){
		 var url = contentInfo.url;
		 var method = contentInfo.method; // if a url, get or post?
		 var data = contentInfo.data; // parameters to pass

		 var cfg = {
			 url : url,
 			 method : method || 'GET'
 		 };

		 if(data){
			 cfg.data = data;
		 }

		 var p = new Promise(function(resolve, reject){
	 		 jQuery.ajax(cfg)
			 .done(function(resp){
				 resolve(resp);
			 })
			 .fail(function(){
				 debug(contentInfo);
				 reject('Failed to load help content from ' + url);
			 });
		 });
		 return p;
	 };

	// ----------------------------------------------------------------------------
	var getLocalContent = function(helpItem){
		var p = new Promise(function(resolve, reject){
			if(!helpItem.text){
				reject('getLocalContent: help does not contain a text attribute: ' + JSON.stringify(helpItem));
				return false;
			}

			resolve(helpItem.text);
		});
		return p;
	};

	// ----------------------------------------------------------------------------

	// ----------------------------------------------------------------------------
	// public
	return {
		initialize : initialize,
		createRenderers : createRenderers,
		modalHelp : modalHelp
	 };
});

if(window.module && window.module.exports){
	module.exports = Bhelpful;
}

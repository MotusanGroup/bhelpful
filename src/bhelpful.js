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
 	* anonymous functions that return true:
		function(){
			return jQuery('input#firstName').val()=='Paul';
		}
	}
 */

 /* opts : { cssPrefix, resourcesBase, locale, onInitialized, debug } */
var Bhelpful = (function(opts){
	var LOG_PREFIX = 'BHELPFUL: ';
	var options = opts;
	var CSS_PREFIX = options.cssPrefix || 'bhlp-';
	var debugEnabled = options.debug || false;
	var providerName = options.providerName || 'help.js';
	var resourcesBase = options.resourcesBase || '/resources';
	var locale = options.locale || 'en-us';
	var initializedCallback = typeof options.onInitialized == 'function' ?
			options.onInitialized : onInitialized;

	// ----------------------------------------------------------------------------
	var predefinedConditions = {
		isEmpty : function(context){
			return jQuery(context.selector).html().length === 0;
		},
		isNotEmpty : function(context){
			return jQuery(context.selector).html().length > 0;
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
		loadResources(function(resources){
			//createRenderers(resources);
			initializedCallback(resources);
		});
	};
	// ----------------------------------------------------------------------------
	var loadResources = function(cb){
		var url = resourcesBase + '/' + locale + '/' + providerName;
		/*
		jQuery.get(url)
		.complete(function(res){
			cb(JSON.parse(res.responseText));
		});
		*/
		jQuery.getScript(url)
		.done(function(resources, textStatus){
			debug(textStatus);
			cb(resources);
		})
		.fail(function(jqxhr, settings, ex){
			error(ex);
		});
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
	var onInitialized = function(resources){
		debug('Bhelpful initialized');
		debug(resources);
	};

	// ----------------------------------------------------------------------------
	var testConditions = function(helpItems, context, cb){
		// merge all help items whose conditions pass (return true)
		var mergedText = '';
		helpItems.forEach(function(helpItem){
			if(!helpItem.if || !helpItem.if.length){
				mergedText += ' ' + helpItem.text;
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
						error('testConditions: invalid condition: ' + JSON.stringify(cond));
					}
				}
				mergedText += ' ' + helpItem.text;
			}
		});
		cb(mergedText);
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
					document : document
				};

				testConditions(helpItems, context, function(helpText){
					rendererConfig.contents = helpText;
					element.showBalloon(rendererConfig);
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
	var getContent = function(contentInfo, cb){
		if(contentInfo.url){
			return getUrlContent(contentInfo, cb);
		}
		else{
			return getLocalContent(contentInfo, cb);
		}
	};

	// ----------------------------------------------------------------------------
	 getUrlContent = function(contentInfo, cb){
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

 		 jQuery.ajax(cfg)
		 .fail(function(){
			 error('Failed to load help content from ' + url);
			 debug(contentInfo);
			 cb({
				 error : 'Failed to load help content from ' + url
			 });
		 })
		 .success(function(resp){
			 cb(resp.responseText);
		 });
	 };

	// ----------------------------------------------------------------------------
	 var getLocalContent = function(helpItems, cb){
		 /*
		 if(!helpItems.length){
			 helpItems = [helpItems];
		 }

		 var finalText = false;
		 for(var i = 0; i<helpItems.length; i++){
			 helpItem = helpItems[i];
			 var text = helpItem.text;

		 }
		 cb(finalText);
		 */
	 };

	 //initialize();

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

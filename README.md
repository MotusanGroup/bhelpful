# bhelpful
Condition-based context-sensitive help

A step up from mapping element selectors to help content, this adds the ability test if the selected element contains content. So you can display different content depending on the state.

Planned features: 
* pluggable renderers (currently depends on jQuery and jQuery.balloon (https://urin.github.io/jquery.balloon.js/))
* pluggable conditions, anonymous functions that return true (currently supports two predefined: isEmpty and isNotEmpty)


// github.com/paulirish/jquery-ajax-localstorage-cache
// dependent on Modernizr's localStorage test

$.ajaxPrefilter( function( options, originalOptions, jqXHR ) {

  // Cache it ?
	// !Modernizr.localstorage || 
	if ( !options.localCache ) return;

	var hourstl = options.cacheTTL || 5;

	var cacheKey = options.cacheKey || 
		options.url.replace( /jQuery.*/,'' ) + options.type + options.data;
	
	Lawnchair(function(){
		
		// isCacheValid is a function to validate cache
		if ( options.isCacheValid && !options.isCacheValid() ){
			// localStorage.removeItem( cacheKey );
			this.remove(cacheKey, function(){
				console.log('removed...'+cacheKey);
			});
		}
		// if there's a TTL that's expired, flush this item
		// var ttl = localStorage.getItem(cacheKey + 'cachettl');
		var ttl;
		this.get(cacheKey + 'cachettl', function(data){
			if (typeof data === 'object'){
				ttl = _ttl = data.exp;
				if ( _ttl && _ttl < +new Date() ){
					// localStorage.removeItem( cacheKey );
					// localStorage.removeItem( cacheKey	+ 'cachettl' );
					// ttl = 'expired';
					this.remove(cacheKey, function(){
						console.log('removed...'+cacheKey);
					});
					this.remove(cacheKey + 'cachettl', function(){
						console.log('removed ttl...'+cacheKey);
					});
					ttl = 'expired';
				}
			}
		});
	
		// var value = localStorage.getItem( cacheKey );
		this.get(cacheKey, function(value){
			if ( value ){
				//In the cache? So get it, apply success callback & abort the XHR request
				// parse back to JSON if we can.
				if ( options.dataType.toLowerCase().indexOf( 'json' ) === 0 ) value = JSON.parse( value.data );
				options.success( value );
				// Abort is broken on JQ 1.5 :(
				jqXHR.abort();
			} else {

				//If it not in the cache, we change the success callback, just put data on localstorage and after that apply the initial callback
				if ( options.success ) {
					options.realsuccess = options.success;
				}
				options.success = function( data ) {
					var strdata = data;
					if ( this.dataType.toLowerCase().indexOf( 'json' ) === 0 ) strdata = JSON.stringify( data );

					// Save the data to localStorage catching exceptions (possibly QUOTA_EXCEEDED_ERR)
					Lawnchair(function(){
						try {
							// localStorage.setItem( cacheKey, strdata );
							this.save({key:cacheKey,data:strdata}, function(){
								console.log('SAVED!');
							});
						} catch (e) {
							console.log('uh oh...some series issues going on here...');
							// Remove any incomplete data that may have been saved before the exception was caught
							localStorage.removeItem( cacheKey );
							localStorage.removeItem( cacheKey + 'cachettl' );
							if ( options.cacheError ) options.cacheError( e, cacheKey, strdata );
						}
					});

					if ( options.realsuccess ) options.realsuccess( data );
				};

				// store timestamp
				if ( ! ttl || ttl === 'expired' ) {
					this.save({key:cacheKey	+ 'cachettl',exp:+new Date() + 1000 * 60 * 60 * hourstl});
					// localStorage.setItem( cacheKey	+ 'cachettl', +new Date() + 1000 * 60 * 60 * hourstl );
				}
			}
		});
	});
});

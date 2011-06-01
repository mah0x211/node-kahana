var pkg = {
		hashlib: require('hashlib'),
		uuid: require('node-uuid')
	},
	KEY = pkg.uuid(),
	EXPIRE = 3600;

this.__defineGetter__( 'expire', function(){
	return EXPIRE;
});
this.__defineSetter__( 'expire', function( expire )
{
	if( expire && expire.constructor === Number ){
		EXPIRE = expire;
	}
	else {
		throw Error( 'failed to set expire: invalid arguments' );
	}
});
this.__defineSetter__( 'secret', function( secret )
{
	if( secret && secret.constructor === String ){
		KEY = secret;
	}
	else {
		throw Error( 'failed to set secret: invalid arguments' );
	}
});

module.exports.create = function()
{
	var session = {
		ts: new Date()
	};
	
	session.exp = new Date( +session.ts + EXPIRE*1000 );
	// session cookie =  uuid-ts-exp.hmac_sha1( uuid-ts-exp, KEY )
	session.id = pkg.uuid();
	session.cookie = [session.id,+session.ts,+session.exp].join('-');
	session.digest = pkg.hashlib.hmac_sha1( session.cookie, KEY );
	session.cookie += '.' + session.digest;
	
	return session;
};

module.exports.varify = function( cookie, restore )
{
	var retval = false;
	
	if( cookie && typeof cookie === 'string' )
	{
		var check = cookie.split( '.', 2 ),
			digest = check[1];
		
		if( digest === pkg.hashlib.hmac_sha1( check[0], KEY ) )
		{
			var now = new Date(),
				exp;
			
			check = check[0].split('-');
			exp = +(check.pop());
			
			if( exp > +now )
			{
				if( restore )
				{
					retval = {
						digest: digest,
						ts: new Date( +(check.pop()) ),
						exp: new Date( exp ),
						id: check.join('-'),
						cookie: cookie
					};
				}
				else {
					retval = true;
				}
			}
		}
	}
	
	return retval;
};

module.exports.update = function( session )
{
	var sobj = undefined;
	
	// check is valid session
	if( session && this.varify( session.cookie, false ) ){
		sobj = this.create();
		sobj.data = session.data;
	}
	
	return sobj;
};


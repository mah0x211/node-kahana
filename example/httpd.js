var Kahana = require('../lib/Kahana'),
	ClearSilver = require('ClearSilver');

function Application()
{
	this.access_count = 0;
	this.clearsilver = new ClearSilver;
	
	this.server = new Kahana.Server( this, __dirname + '/server/server.conf' );
	this.server.Listen();
}

// stop
Application.prototype.SIGTERM = function(){
	console.log( 'SIGTERM' );
	this.server.Close();
	process.exit();
};
Application.prototype.SIGINT = function(){
	console.log( 'SIGINT' );
	this.server.Close();
	process.exit();
};
// graceful stop
Application.prototype.SIGWINCH = function(){
	console.log( 'SIGWINCH: nconn -> ' + this.server.nconn );
	var self = this;
	this.server.CloseGraceful( null, function( errno ){
		console.log( 'close: ' + self.server.nconn );
	} );
};
// restart
/*
Application.prototype.SIGHUP = function(){
	console.log( 'SIGHUP' );
	this.server.Close();
	this.server.Listen();
};
*/
// graceful restart
Application.prototype.SIGUSR1 = function()
{
	console.log( 'SIGUSR1: nconn -> ' + this.server.nconn );
	var self = this;
	this.server.CloseGraceful( null, function( errno ){
		console.log( 'restart: ' + self.server.nconn );
		self.server.Listen();
	} );
};

// set document root to clearsilver
Application.prototype.SetDocumentRoot = function( docroot )
{
	this.clearsilver.SetDocumentRoot( docroot );
};
Application.prototype.Render = function( r, is_tmpl, callback )
{
	if( is_tmpl )
	{
		this.server.SessionUpdate( r );
		try {
			r.page = this.clearsilver.RenderString( r.page, r.hdf );
		}
		catch( e ){
			callback( e, r );
		}
		finally{
			callback( undefined, r );
		}
	}
	else {
		callback( undefined, r );
	}
	return;
};

Application.prototype.AddLog = function( r, log )
{
	if( !r.hdf['log'] ){
		r.hdf.log = [];
	}
	r.hdf.log.push( log );
};

Application.prototype.CheckRequest = function( r, last, runNext )
{
	// if method post
	if( r.req.method == 'POST' && !r.data )
	{
		var self = this,
			progress = function( bytes, totalbytes ){
				console.log( 'progress: ' + bytes + '/' + totalbytes );
			},
			finish = function( err, r ){
				runNext( last, r );
			};
		
		// get request data
		if( this.server.RequestData( r, progress, finish ) ){
			// close if return not 0
			this.DeadEnd( r );
		}
	}
	else
	{
		runNext( last, r );
	}
};

Application.prototype.DeadEnd = function( last, r )
{
	// console.log( r.parsed_url.pathname + ': ' + new Error().stack );
	
	var self = this,
		// received cookie
		cookie = this.server.RequestCookie( r );
	
	this.server.SetCookie( r, { name:'access_cookie', val:this.access_count++, path:'/' }, true );
	
	r.hdf.parsed_url = r.parsed_url;
	r.hdf.data = r.data;
	// set received cookie
	r.hdf.cookie = cookie;
	r.hdf.session = r.session;
	
	this.server.MapToStorage( r, function( err, status, r )
	{
		if( status ){
			self.server.RequestClose( r, status );
		}
		else {
			self.server.RequestClose( r, 200 );
		}
	} );
}

// implements
Application.prototype.Allow = function( route, r, method, args, last, runNext )
{
	this.AddLog( r, 'route[' + route + ']: call -> ' + method + ', args -> ' + args + ', last -> ' + last + ', runNext: ' + typeof( runNext ) );
	runNext( last, r );
};

Application.prototype.Handler = function( route, r, method, args, last, runNext )
{
	this.AddLog( r, 'route[' + route + ']: call -> ' + method + ', args -> ' + args + ', last -> ' + last + ', runNext: ' + typeof( runNext ) );
	this.CheckRequest( r, last, runNext );
};

Application.prototype.Require = function( route, r, method, args, last, runNext )
{
	this.AddLog( r, 'route[' + route + ']: call -> ' + method + ', args -> ' + args + ', last -> ' + last + ', runNext: ' + typeof( runNext ) );
	runNext( last, r );
};



Application.prototype.Detour = function( route, r, method, args, last, runNext )
{
	this.AddLog( r, 'route[' + route + '][Detour]: call -> ' + method + ', args -> ' + args + ', last -> ' + last + ', runNext: ' + typeof( runNext ) );
	
	runNext( last, r );
};

new Application();

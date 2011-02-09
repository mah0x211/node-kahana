var Kahana = require('../lib/Kahana');

function Application()
{
	this.access_count = 0;
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

// template rendering error
Application.prototype.ParseError = function( err )
{
	console.log( err );
};

Application.prototype.AddLog = function( r, log )
{
	if( !r.hdf['log'] ){
		r.hdf.log = [];
	}
	r.hdf.log.push( log );
};

Application.prototype.CloseRequest = function( r )
{
	var self = this;
	// received cookie
	var cookie = this.server.RequestCookie( r );
	
	this.server.SetCookie( r, { name:'access_cookie', val:this.access_count++, path:'/' } );
	
	r.hdf.parsed_url = r.parsed_url;
	r.hdf.data = r.data;
	// set received cookie
	r.hdf.cookie = {};
	for( var p in cookie ){
		r.hdf.cookie[p] = cookie[p].join(', ' );
	}
	
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
	
	if( runNext ){
		runNext(true);
	}
	else {
		this.CloseRequest( r );
	}
};

Application.prototype.Handler = function( route, r, method, args, last, runNext )
{

	this.AddLog( r, 'route[' + route + ']: call -> ' + method + ', args -> ' + args + ', last -> ' + last + ', runNext: ' + typeof( runNext ) );

	if( runNext ){
		runNext(true);
	}
	else {
		this.CloseRequest( r );
	}
};

Application.prototype.Require = function( route, r, method, args, last, runNext )
{
	this.AddLog( r, 'route[' + route + ']: call -> ' + method + ', args -> ' + args + ', last -> ' + last + ', runNext: ' + typeof( runNext ) );
	if( runNext ){
		runNext(true);
	}
	else {
		this.CloseRequest( r );
	}
};

Application.prototype.Detour = function( route, r, method, args, last, runNext )
{
	this.AddLog( r, 'route[' + route + '][Detour]: call -> ' + method + ', args -> ' + args + ', last -> ' + last + ', runNext: ' + typeof( runNext ) );
	
	// if method post
	if( r.req.method == 'POST' && !r.data )
	{
		var self = this;
		var progress = function( bytes, totalbytes ){
			console.log( 'progress: ' + bytes + '/' + totalbytes );
		};
		var finish = function( err, r )
		{
			if( runNext ){
				runNext(true);
			}
			else {
				self.CloseRequest( r );
			}
		};
		
		// get request data
		if( this.server.RequestData( r, progress, finish ) ){
			// close if return not 0
			this.CloseRequest( r );
		}
	}
	else
	{
		if( runNext ){
			runNext(true);
		}
		else {
			this.CloseRequest( r );
		}
	}
};

new Application();

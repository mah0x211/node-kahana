/*
	Server.js
	author: masatoshi teruya
	email: mah0x211@gmail.com
	copyright (C) 2011, masatoshi teruya. all rights reserved.
*/
var package = {
		fs: require('fs'),
		path: require('path'),
		http: require('http'),
		formidable: require('formidable'),
		url: require('url'),
		mime: require('mime')
	},
	Kahana = require( __dirname + '/Kahana' );

Kahana.Inherits( Server, Kahana );
function Server( app, confpath )
{
	// defailt configuration
	this.defaultConf = {
		ServerRoot: process.cwd(),
		ServerName: undefined,
		Listen: '127.0.0.1',
		Port: 1977,
		User: process.getuid(),
		Group: process.getgid(),
		PidFile: 'logs/kahana.pid',
		LimitRequestBody: 0,
		LimitRequestLine: 8190,
		Timeout: 300,
		DefaultType: 'text/plain',
		DocumentRoot: 'htdocs',
		ErrorLog: 'logs/error_log',
		// TempDir: undefined,
		// KeepAlive: undefined,
		// DirectoryIndex: undefined,
		// DirectorySlash: undefined,
		Route: {}
	};
	
	// router
	this.router = new Kahana.Router( app );
	// page generator
	this.generator = new Kahana.ClearSilver;
	// configuration
	this.conf = null;
	this.confpath = confpath;
	this.Configure();
	// server setup
	this.core = null;
	this.Setup();
};

Server.prototype.Configure = function()
{
	var pidfd;
	
	// configuration path resolve
	this.confpath = package.fs.realpathSync( this.confpath );
	// read configuraton file
	this.conf = JSON.parse( package.fs.readFileSync( this.confpath, 'utf8' ) );
	// set ServerRoot and chdir
	this.conf.ServerRoot = package.fs.realpathSync( this.conf.ServerRoot );
	process.chdir( this.conf.ServerRoot );
	// set ErrorLog
	if( this.conf.ErrorLog ){
		this.conf.ErrorLogFD = package.fs.openSync( this.conf.ErrorLog, 'a' );
	}
	// set DocumentRoot
	this.conf.DocumentRoot = package.fs.realpathSync( this.conf.DocumentRoot );
	// set rewrite configuration
	for( var prop in this.defaultConf )
	{
		if( !this.conf[prop] ){
			this.conf[prop] = this.defaultConf[prop];
		}
	}
	// set ServerName
	// set process title
	if( !this.conf.ServerName ){
		this.conf.ServerName = this.conf.Listen;
		// process.title = 'node-kahana@' + this.conf.ServerName + ':' + this.conf.Port;
	}
	else {
		// process.title = this.conf.ServerName + ':' + this.conf.Port;
	}
	
	// set LimitRequestBody
	if( this.conf.LimitRequestBody ){
		this.conf.LimitRequestBody = +this.conf.LimitRequestBody;
	}
	// set Timeout
	if( this.conf.Timeout ){
		this.conf.Timeout = +this.conf.Timeout;
	}
	// set KeepAlive
	if( String( this.conf.KeepAlive ).toLowerCase() == 'on' ){
		this.conf.KeepAlive = 1;
	}
	// set DirectorySlash
	if( String( this.conf.DirectorySlash ).toLowerCase() == 'on' ){
		this.conf.DirectorySlash = 1;
	}
	
	// set pid file
	pidfd = package.fs.openSync( this.conf.PidFile, 'w' );
	package.fs.write( pidfd, new Buffer( String( process.pid ) ), 0, String( process.pid ).length, null );
	package.fs.closeSync( pidfd );
	
	// initialize routing table
	this.router.TableAdd( this.conf.Route );
};

Server.prototype.Setup = function()
{
	var self = this;
	
	// create server
	this.core = package.http.createServer();
	
	// server close
	this.core.on( 'close', function( errno ){
		console.log( 'Server will be close[' + errno + ']: '  + self.conf.Listen + ':' + self.conf.Port );
		package.fs.unlinkSync( self.conf.PidFile );
		package.fs.closeSync( self.conf.ErrorLogFD );
		
	} );
	
	// create and add http request handler
	this.core.on( 'request', function( req, res ){
		self.RequestCheck( req, res );
	} );
	
	// upgrade
	// this.core.on( 'upgrade', function( req, sock, head ){ conf.delegate.onUpgrade( req, sock, head ); } );	
	/*
	// client socket error
	this.core.on( 'clientError', function( exception ){ 
		console.log( 'clientError->exception: ' + exception );
	} );
	*/
};

Server.prototype.Close = function()
{
	try
	{
		this.core.close();
		// remove pid file
		package.fs.unlinkSync( this.conf.PidFile );
		// close log
		package.fs.closeSync( this.conf.ErrorLogFD );
	}
	catch( e ){
		console.log( e );
	};
};

Server.prototype.Listen = function( callback )
{
	var self = this;
	this.router.Finalize();
	
	try
	{
		this.core.listen( this.conf.Port, this.conf.Listen, function()
		{
			// console.log( 'Staring server: ' + self.conf.Listen + ':' + self.conf.Port + ' on ' + process.platform + "\nDocumentRoot: " + self.conf.DocumentRoot );
			// set uid/gid
			process.setuid( self.conf.User );
			process.setgid( self.conf.Group );
			if( callback )
			{
				if( Kahana.TypeOf( callback, Kahana.T_FUNC ) ){
					callback();
				}
				else if( Kahana.TypeOf( callback, Kahana.T_STR ) ){
					Kahana.NotificationCenter.PostNotification( this, callback );
				}
			}
		} );
	}
	catch(e)
	{
		if( callback )
		{
			if( Kahana.TypeOf( callback, Kahana.T_FUNC ) ){
				callback(e);
			}
			else if( Kahana.TypeOf( callback, Kahana.T_STR ) ){
				Kahana.NotificationCenter.PostNotification( this, callback, e );
			}
		}
		else {
			console.log( e.message );
		}
	};
};



Server.prototype.ErrorPage = function( r )
{
	r.mime = 'text/html';
	switch( r.status )
	{
		case 100:
			r.page = '<html><head><title>100 CONTINUE</title></head><body><h1>100 CONTINUE</h1><p>Failed to Requested URL: ' + encodeURI( r.req.url ) + '<br />reason: CONTINUE </p></body></html>';
		break;
		case 101:
			r.page = '<html><head><title>101 SWITCHING PROTOCOLS</title></head><body><h1>101 SWITCHING PROTOCOLS</h1><p>Failed to Requested URL: ' + encodeURI( r.req.url ) + '<br />reason: SWITCHING PROTOCOLS </p></body></html>';
		break;
		case 102:
			r.page = '<html><head><title>102 PROCESSING</title></head><body><h1>102 PROCESSING</h1><p>Failed to Requested URL: ' + encodeURI( r.req.url ) + '<br />reason: PROCESSING </p></body></html>';
		break;
		case 200:
			r.page = '<html><head><title>200 OK</title></head><body><h1>200 OK</h1><p>Failed to Requested URL: ' + encodeURI( r.req.url ) + '<br />reason: OK </p></body></html>';
		break;
		case 201:
			r.page = '<html><head><title>201 CREATED</title></head><body><h1>201 CREATED</h1><p>Failed to Requested URL: ' + encodeURI( r.req.url ) + '<br />reason: CREATED </p></body></html>';
		break;
		case 202:
			r.page = '<html><head><title>202 ACCEPTED</title></head><body><h1>202 ACCEPTED</h1><p>Failed to Requested URL: ' + encodeURI( r.req.url ) + '<br />reason: ACCEPTED </p></body></html>';
		break;
		case 203:
			r.page = '<html><head><title>203 NON AUTHORITATIVE</title></head><body><h1>203 NON AUTHORITATIVE</h1><p>Failed to Requested URL: ' + encodeURI( r.req.url ) + '<br />reason: NON AUTHORITATIVE </p></body></html>';
		break;
		case 204:
			r.page = '<html><head><title>204 NO CONTENT</title></head><body><h1>204 NO CONTENT</h1><p>Failed to Requested URL: ' + encodeURI( r.req.url ) + '<br />reason: NO CONTENT </p></body></html>';
		break;
		case 205:
			r.page = '<html><head><title>205 RESET CONTENT</title></head><body><h1>205 RESET CONTENT</h1><p>Failed to Requested URL: ' + encodeURI( r.req.url ) + '<br />reason: RESET CONTENT </p></body></html>';
		break;
		case 206:
			r.page = '<html><head><title>206 PARTIAL CONTENT</title></head><body><h1>206 PARTIAL CONTENT</h1><p>Failed to Requested URL: ' + encodeURI( r.req.url ) + '<br />reason: PARTIAL CONTENT </p></body></html>';
		break;
		case 207:
			r.page = '<html><head><title>207 MULTI STATUS</title></head><body><h1>207 MULTI STATUS</h1><p>Failed to Requested URL: ' + encodeURI( r.req.url ) + '<br />reason: MULTI STATUS </p></body></html>';
		break;
		case 300:
			r.page = '<html><head><title>300 MULTIPLE CHOICES</title></head><body><h1>300 MULTIPLE CHOICES</h1><p>Failed to Requested URL: ' + encodeURI( r.req.url ) + '<br />reason: MULTIPLE CHOICES </p></body></html>';
		break;
		case 301:
			r.page = '<html><head><title>301 MOVED PERMANENTLY</title></head><body><h1>301 MOVED PERMANENTLY</h1><p>Failed to Requested URL: ' + encodeURI( r.req.url ) + '<br />reason: MOVED PERMANENTLY </p></body></html>';
		break;
		case 302:
			r.page = '<html><head><title>302 MOVED TEMPORARILY</title></head><body><h1>302 MOVED TEMPORARILY</h1><p>Failed to Requested URL: ' + encodeURI( r.req.url ) + '<br />reason: MOVED TEMPORARILY </p></body></html>';
		break;
		case 303:
			r.page = '<html><head><title>303 SEE OTHER</title></head><body><h1>303 SEE OTHER</h1><p>Failed to Requested URL: ' + encodeURI( r.req.url ) + '<br />reason: SEE OTHER </p></body></html>';
		break;
		case 304:
			r.page = '<html><head><title>304 NOT MODIFIED</title></head><body><h1>304 NOT MODIFIED</h1><p>Failed to Requested URL: ' + encodeURI( r.req.url ) + '<br />reason: NOT MODIFIED </p></body></html>';
		break;
		case 305:
			r.page = '<html><head><title>305 USE PROXY</title></head><body><h1>305 USE PROXY</h1><p>Failed to Requested URL: ' + encodeURI( r.req.url ) + '<br />reason: USE PROXY </p></body></html>';
		break;
		case 307:
			r.page = '<html><head><title>307 TEMPORARY REDIRECT</title></head><body><h1>307 TEMPORARY REDIRECT</h1><p>Failed to Requested URL: ' + encodeURI( r.req.url ) + '<br />reason: TEMPORARY REDIRECT </p></body></html>';
		break;
		case 400:
			r.page = '<html><head><title>400 BAD REQUEST</title></head><body><h1>400 BAD REQUEST</h1><p>Failed to Requested URL: ' + encodeURI( r.req.url ) + '<br />reason: BAD REQUEST </p></body></html>';
		break;
		case 401:
			r.page = '<html><head><title>401 UNAUTHORIZED</title></head><body><h1>401 UNAUTHORIZED</h1><p>Failed to Requested URL: ' + encodeURI( r.req.url ) + '<br />reason: UNAUTHORIZED </p></body></html>';
		break;
		case 402:
			r.page = '<html><head><title>402 PAYMENT REQUIRED</title></head><body><h1>402 PAYMENT REQUIRED</h1><p>Failed to Requested URL: ' + encodeURI( r.req.url ) + '<br />reason: PAYMENT REQUIRED </p></body></html>';
		break;
		case 403:
			r.page = '<html><head><title>403 FORBIDDEN</title></head><body><h1>403 FORBIDDEN</h1><p>Failed to Requested URL: ' + encodeURI( r.req.url ) + '<br />reason: FORBIDDEN </p></body></html>';
		break;
		case 404:
			r.page = '<html><head><title>404 NOT FOUND</title></head><body><h1>404 NOT FOUND</h1><p>Failed to Requested URL: ' + encodeURI( r.req.url ) + '<br />reason: NOT FOUND </p></body></html>';
		break;
		case 405:
			r.page = '<html><head><title>405 METHOD NOT ALLOWED</title></head><body><h1>405 METHOD NOT ALLOWED</h1><p>Failed to Requested URL: ' + encodeURI( r.req.url ) + '<br />reason: METHOD NOT ALLOWED </p></body></html>';
		break;
		case 406:
			r.page = '<html><head><title>406 NOT ACCEPTABLE</title></head><body><h1>406 NOT ACCEPTABLE</h1><p>Failed to Requested URL: ' + encodeURI( r.req.url ) + '<br />reason: NOT ACCEPTABLE </p></body></html>';
		break;
		case 407:
			r.page = '<html><head><title>407 PROXY AUTHENTICATION REQUIRED</title></head><body><h1>407 PROXY AUTHENTICATION REQUIRED</h1><p>Failed to Requested URL: ' + encodeURI( r.req.url ) + '<br />reason: PROXY AUTHENTICATION REQUIRED </p></body></html>';
		break;
		case 408:
			r.page = '<html><head><title>408 REQUEST TIME OUT</title></head><body><h1>408 REQUEST TIME OUT</h1><p>Failed to Requested URL: ' + encodeURI( r.req.url ) + '<br />reason: REQUEST TIME OUT </p></body></html>';
		break;
		case 409:
			r.page = '<html><head><title>409 CONFLICT</title></head><body><h1>409 CONFLICT</h1><p>Failed to Requested URL: ' + encodeURI( r.req.url ) + '<br />reason: CONFLICT </p></body></html>';
		break;
		case 410:
			r.page = '<html><head><title>410 GONE</title></head><body><h1>410 GONE</h1><p>Failed to Requested URL: ' + encodeURI( r.req.url ) + '<br />reason: GONE </p></body></html>';
		break;
		case 411:
			r.page = '<html><head><title>411 LENGTH REQUIRED</title></head><body><h1>411 LENGTH REQUIRED</h1><p>Failed to Requested URL: ' + encodeURI( r.req.url ) + '<br />reason: LENGTH REQUIRED </p></body></html>';
		break;
		case 412:
			r.page = '<html><head><title>412 PRECONDITION FAILED</title></head><body><h1>412 PRECONDITION FAILED</h1><p>Failed to Requested URL: ' + encodeURI( r.req.url ) + '<br />reason: PRECONDITION FAILED </p></body></html>';
		break;
		case 413:
			r.page = '<html><head><title>413 REQUEST ENTITY TOO LARGE</title></head><body><h1>413 REQUEST ENTITY TOO LARGE</h1><p>Failed to Requested URL: ' + encodeURI( r.req.url ) + '<br />reason: REQUEST ENTITY TOO LARGE </p></body></html>';
		break;
		case 414:
			r.page = '<html><head><title>414 REQUEST URI TOO LARGE</title></head><body><h1>414 REQUEST URI TOO LARGE</h1><p>Failed to Requested URL: ' + encodeURI( r.req.url ) + '<br />reason: REQUEST URI TOO LARGE </p></body></html>';
		break;
		case 415:
			r.page = '<html><head><title>415 UNSUPPORTED MEDIA TYPE</title></head><body><h1>415 UNSUPPORTED MEDIA TYPE</h1><p>Failed to Requested URL: ' + encodeURI( r.req.url ) + '<br />reason: UNSUPPORTED MEDIA TYPE </p></body></html>';
		break;
		case 416:
			r.page = '<html><head><title>416 RANGE NOT SATISFIABLE</title></head><body><h1>416 RANGE NOT SATISFIABLE</h1><p>Failed to Requested URL: ' + encodeURI( r.req.url ) + '<br />reason: RANGE NOT SATISFIABLE </p></body></html>';
		break;
		case 417:
			r.page = '<html><head><title>417 EXPECTATION FAILED</title></head><body><h1>417 EXPECTATION FAILED</h1><p>Failed to Requested URL: ' + encodeURI( r.req.url ) + '<br />reason: EXPECTATION FAILED </p></body></html>';
		break;
		case 422:
			r.page = '<html><head><title>422 UNPROCESSABLE ENTITY</title></head><body><h1>422 UNPROCESSABLE ENTITY</h1><p>Failed to Requested URL: ' + encodeURI( r.req.url ) + '<br />reason: UNPROCESSABLE ENTITY </p></body></html>';
		break;
		case 423:
			r.page = '<html><head><title>423 LOCKED</title></head><body><h1>423 LOCKED</h1><p>Failed to Requested URL: ' + encodeURI( r.req.url ) + '<br />reason: LOCKED </p></body></html>';
		break;
		case 424:
			r.page = '<html><head><title>424 FAILED DEPENDENCY</title></head><body><h1>424 FAILED DEPENDENCY</h1><p>Failed to Requested URL: ' + encodeURI( r.req.url ) + '<br />reason: FAILED DEPENDENCY </p></body></html>';
		break;
		case 426:
			r.page = '<html><head><title>426 UPGRADE REQUIRED</title></head><body><h1>426 UPGRADE REQUIRED</h1><p>Failed to Requested URL: ' + encodeURI( r.req.url ) + '<br />reason: UPGRADE REQUIRED </p></body></html>';
		break;
		case 501:
			r.page = '<html><head><title>501 NOT IMPLEMENTED</title></head><body><h1>501 NOT IMPLEMENTED</h1><p>Failed to Requested URL: ' + encodeURI( r.req.url ) + '<br />reason: NOT IMPLEMENTED </p></body></html>';
		break;
		case 502:
			r.page = '<html><head><title>502 BAD GATEWAY</title></head><body><h1>502 BAD GATEWAY</h1><p>Failed to Requested URL: ' + encodeURI( r.req.url ) + '<br />reason: BAD GATEWAY </p></body></html>';
		break;
		case 503:
			r.page = '<html><head><title>503 SERVICE UNAVAILABLE</title></head><body><h1>503 SERVICE UNAVAILABLE</h1><p>Failed to Requested URL: ' + encodeURI( r.req.url ) + '<br />reason: SERVICE UNAVAILABLE </p></body></html>';
		break;
		case 504:
			r.page = '<html><head><title>504 GATEWAY TIME OUT</title></head><body><h1>504 GATEWAY TIME OUT</h1><p>Failed to Requested URL: ' + encodeURI( r.req.url ) + '<br />reason: GATEWAY TIME OUT </p></body></html>';
		break;
		case 505:
			r.page = '<html><head><title>505 VERSION NOT SUPPORTED</title></head><body><h1>505 VERSION NOT SUPPORTED</h1><p>Failed to Requested URL: ' + encodeURI( r.req.url ) + '<br />reason: VERSION NOT SUPPORTED </p></body></html>';
		break;
		case 506:
			r.page = '<html><head><title>506 VARIANT ALSO VARIES</title></head><body><h1>506 VARIANT ALSO VARIES</h1><p>Failed to Requested URL: ' + encodeURI( r.req.url ) + '<br />reason: VARIANT ALSO VARIES </p></body></html>';
		break;
		case 507:
			r.page = '<html><head><title>507 INSUFFICIENT STORAGE</title></head><body><h1>507 INSUFFICIENT STORAGE</h1><p>Failed to Requested URL: ' + encodeURI( r.req.url ) + '<br />reason: INSUFFICIENT STORAGE </p></body></html>';
		break;
		case 510:
			r.page = '<html><head><title>510 NOT EXTENDED</title></head><body><h1>510 NOT EXTENDED</h1><p>Failed to Requested URL: ' + encodeURI( r.req.url ) + '<br />reason: NOT EXTENDED </p></body></html>';
		break;
		case 500:
		default:
			r.status = 500;
			r.page = '<html><head><title>500 INTERNAL SERVER ERROR</title></head><body><h1>500 INTERNAL SERVER ERROR</h1><p>Failed to Requested URL: ' + encodeURI( r.req.url ) + '<br />reason: INTERNAL SERVER ERROR </p></body></html>';
		break;
	}
}


// MARK: Headers
Server.prototype.SetHeader = function( r, key, val ){
	r.headers[key] = val;
};

Server.prototype.AddHeader = function( r, key, val )
{
	if( r.headers[key] )
	{
		if( !Kahana.InstanceOf( r.headers[key], Array ) ){
			r.headers[key] = [r.headers[key]];
		}
		r.headers[key].push( val );
	}
	else {
		r.headers[key] = val;
	}
};

Server.prototype.SetCookie = function( r, cookie )
{
	if( cookie.name )
	{
		var fields = ['expire','domain','path'];
		var val = cookie.name + '=' + escape(cookie.val);
		
		for( var i = 0; i < 5; i++ )
		{
			if( cookie[fields[i]] ){
				val += '; ' + fields[i] + '=' + cookie[fields[i]];
			}
		}
		if( cookie.secure ){
			val += '; secure';
		}
		this.AddHeader( r, 'Set-Cookie', val );
	}
};



Server.prototype.RequestClose = function( r, status )
{
	// clear timeout
	clearTimeout( r.timeout );
	// set status
	r.status = ( status ) ? status : r.status;
	
	// HEAD
	if( r.req.method == 'HEAD' ){
		// set generater
		r.headers['X-Powered-By'] = 'Kahana';
		r.headers['Content-Type'] = r.server.conf.DefaultType;
		r.res.writeHead( r.status, r.headers );
		r.res.end();
	}
	else
	{
		// page rendering
		if( !r.page.length ){
			this.ErrorPage( r );
		}
		else
		{
			// try to rendering
			try {
				r.page = this.generator.renderString( r.page, r.hdf );
			}
			// if error: HTTP INTERNAL SERVER ERROR
			catch( e ){
				r.status = 500;
				this.ErrorPage( r );
			};
		};
		
		// set content-type
		if( r.mime ){
			r.headers['Content-Type'] = r.mime;
		}
		else if( r.parsed_url.pathfile && r.parsed_url.pathfile_readed ){
			r.headers['Content-Type'] = package.mime.lookup( r.parsed_url.pathfile );
		}
		else {
			r.headers['Content-Type'] = r.server.conf.DefaultType;
		}
		// set content-length
		r.headers['Content-Length'] = Buffer.byteLength( r.page );
		// set generater
		r.headers['X-Powered-By'] = 'Kahana';
		r.res.writeHead( r.status, r.headers );
		r.res.end( r.page );
	}
	
	delete r;
};

Server.prototype.RequestData = function( r, progress, callback )
{
	if( r.status == 0 )
	{
		// if r.data is defined or 
		// content-type is not application/x-www-form-urlencoded or multipart/form-data request
		// do nothing
		if( r.data || !r.req.headers['content-type'] || 
			!r.req.headers['content-type'].match( '^(application/x-www-form-urlencoded|multipart/form-data)' ) )
		{
			// set null data for router 
			if( !r.data ){ r.data = {}; }
			process.nextTick( function(){ callback( undefined, r ); } );
		}
		else
		{
			r.data = { length: 0, fields:{}, files:{} };
			// transfer-encoding
			if( r.req.headers['transfer-encoding'] )
			{
				// bad request if not chunked
				if( r.req.headers['transfer-encoding'] != 'chunked' ){
					r.status = 400;
				}
			}
			// length required
			else if( !r.req.headers['content-length'] ){
				r.status = 411;
			}
			// check LimitRequestBody
			else if( this.conf.LimitRequestBody && 
					( r.data.length = +r.req.headers['content-length'] ) > this.conf.LimitRequestBody ){
				r.status = 413;
			}
			
			if( !r.status )
			{
				var form = new package.formidable.IncomingForm();
				
				if( r.server.conf.TempDir ){
					form.uploadDir = r.server.conf.TempDir;
				}
				
				form.on( 'field', function( field, value ){
					r.data.fields[field] = value;
				} )
				.on( 'file', function( field, value ){
					r.data.files[field] = value;
				} )
				.on( 'error', function( err ){
					callback( err, r );
				} )
				.on( 'end', function(){
					r.data.length = this.bytesReceived;
					callback( undefined, r );
				} );
				// register progress
				if( progress ){
					form.on( 'progress', progress );
				}

				form.parse( r.req );
			}
		}
	}
	
	return r.status;
};

Server.prototype.RequestCookie = function( r )
{
	if( !r.cookie && r.req.headers['cookie'] )
	{
		var regex = new RegExp("; ", "g"),
			cookies = r.req.headers.cookie.split( regex ),
			len = cookies.length;
		
		if( len )
		{
			r.cookie = {};
			for( var i = 0; i < len; i++ )
			{
				var kv = cookies[i].split( '=', 2 );
				if( !r.cookie[kv[0]] ){
					r.cookie[kv[0]] = [];
				}
				r.cookie[kv[0]].push( kv[1] );
			}
		}
	}
	return r.cookie;
}

Server.prototype.RequestCheck = function( req, res )
{
	var r = {
		// internal
		server: this,
		req: req,
		res: res,
		timeout: undefined,
		// imcoming
		parsed_url: {},
		data: undefined,
		cookie: undefined,
		// output
		status: 0,
		page: '',
		mime: undefined,
		hdf: {},
		headers: {}
	};
	
	// check keep-alive
	if( !this.conf.KeepAlive ){
		// set keep-alive off
		res.shouldKeepAlive = false
	}
	// set Timeout interval
	if( this.conf.Timeout ){
		r.timeout = setTimeout( function() {
			r.server.RequestClose( r, 408 );
		}, this.conf.Timeout*1000 );
	}
	
	// check LimitRequestLine
	if( req.url.length > this.conf.LimitRequestLine ){
		this.RequestClose( r, 414 );
	}
	else {
		// TranslateName
		r.parsed_url = this.TranslateName( req.url );
		// routing
		this.router.Run( ( r.parsed_url.pathname_resolve ) ? 
						   r.parsed_url.pathname_resolve : 
						   r.parsed_url.pathname, 
						   ( r.data ) ? true : false,
						   r );
	}
};

Server.prototype.TranslateName = function( uri )
{
	var parsed_url = {},
		tail = '';
	
	// parse url
	parsed_url = package.url.parse( decodeURIComponent( uri ), true );
	// path normalize
	parsed_url.pathname = package.path.normalize( parsed_url.pathname );
	// TODO: Alias
	// check tail
	tail = parsed_url.pathname.charAt( parsed_url.pathname.length - 1 );
	// set directory index and check exists
	if( tail == '/' && this.conf.DirectoryIndex ){
		parsed_url.pathname_resolve = parsed_url.pathname + this.conf.DirectoryIndex;
		parsed_url.pathfile = this.conf.DocumentRoot + parsed_url.pathname_resolve;
	}
	// set realpath based on DocumentRoot
	else {
		parsed_url.pathfile = this.conf.DocumentRoot + parsed_url.pathname;
	}
	
	return parsed_url;
};

Server.prototype.MapToStorage = function( r, callback )
{
	// check stat
	package.fs.readFile( r.parsed_url.pathfile, function( err, data )
	{
		var status = 0;
		
		if( err )
		{
			switch( err.errno ){
				case 9:		// EBADF: Bad file descriptor 
				case 12:	// ENOMEM: Cannot allocate memory
				case 14:	// EFAULT: Bad address
				case 62:	// ELOOP: Too many levels of symbolic links
				case 63:	// ENAMETOOLONG: File name too long
					status = 500;
				break;
				case 13:	// EACCES: Permission denied
					status = 403;
				break;
				case 21:	// EISDIR
					// set redirect if parsed_url.pathname is not end at slash
					if( !r.parsed_url.pathname_resolve && r.server.conf.DirectorySlash ){
						r.server.SetHeader( r, 'Location', r.parsed_url.pathname + '/' + 
										( ( r.parsed_url.search ) ? r.parsed_url.search : '' ) );
						status = 301;
					}
					// not found
					else {
						status = 404;
					}
				break;
				//	2 = ENOENT: No such file or directory
				//	20 = ENOTDIR: Not a directory
				default:
					status = 404;
			}
		}
		else {
			r.page = data.toString('utf8');
			r.parsed_url.pathfile_readed = true;
		}
		callback( err, status, r );
	} );
};

// !!!: absolutely slow... i have to do different way
/*
Server.prototype.MapToStorage2 = function( r, callback )
{
	// check stat
	package.fs.stat( r.parsed_url.pathfile, function( err, stats )
	{
		var status = 0;
		
		if( err )
		{
			switch( err.errno ){
				case 9:		// EBADF: Bad file descriptor 
				case 12:	// ENOMEM: Cannot allocate memory
				case 14:	// EFAULT: Bad address
				case 62:	// ELOOP: Too many levels of symbolic links
				case 63:	// ENAMETOOLONG: File name too long
					status = 500;
				break;
				case 13:	// EACCES: Permission denied
					status = 403;
				break
				//	2 = ENOENT: No such file or directory
				//	20 = ENOTDIR: Not a directory
				default:
					status = 404;
			}
		}
		else if( stats.isFile() ){
			r.finfo = stats;
		}
		else if( stats.isDirectory() && !r.parsed_url.pathname_resolve )
		{
			// set redirect if parsed_url.pathname is not end at slash
			if( r.server.conf.DirectorySlash )
			{
				var url = r.parsed_url.pathname + '/';
				
				if( r.parsed_url.search ){
					url += r.parsed_url.search;
				}
				r.server.SetHeader( r, 'Location', url );
				status = 301;
			}
			// not found
			else {
				status = 404;
			}
		}
		// not found
		else {
			status = 404;
		}
		callback( err, status, r );
	} );
};
*/

module.exports = Server;

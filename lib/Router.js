/*
	Router.js
	author: masatoshi teruya
	email: mah0x211@gmail.com
	copyright (C) 2011, masatoshi teruya. all rights reserved.
	
	CREATE ROUTER:
		var router = new Router( delegator );
		delegator must following methods implement: 
			delegator.prototype.Detour( uri, ctx, method-name, args );
			
	ADDING ROUTING TABLE
		router.TableAdd( routing_table_format:Object );
	
	ROUTING TABLE FORMAT:
		{
			"/path/to/url1": {
				"method1": "args",
				"method2": ["args"],
				...
			},
			"/path/to/url2": {
				"method1": "args",
				"method2": ["args"],
				...
			},
			...
		}
	
	RUN ROUTE:
		router.run( '/path/to/uri1', context:Object );
			if found directive for route:'/path/to/uri1'
				if defined function delegate.method1
					delegate.method1( uri, ctx, method1, args, runNext );
				else
					delegate.Detour( uri, ctx, method1, args, runNext );
			else
				delegate.Detour( uri, ctx, method1 );
*/
var package = {
		path: require('path'),
	},
	Kahana = require( __dirname + '/Kahana' );

Kahana.Inherits( Router, Kahana );
function Router( delegator )
{
	this.directives = {};
	this.route = [];
	
	if( !Kahana.TypeOf( delegator.Detour, Kahana.T_FUNC ) ){
		throw new Error( 'delegator does not implements required methods: Detour' );
	}
	else {
		this.delegator = delegator;
		this.SetSignalEvents();
	}
};


Router.prototype.SetSignalEvents = function()
{
	var self = this,
		signames = [
			'SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 
			'SIGTRAP', 'SIGABRT', 'SIGEMT', 'SIGFPE', 
			'SIGKILL', 'SIGBUS', 'SIGSEGV', 'SIGSYS', 
			'SIGPIPE', 'SIGALRM', 'SIGTERM', 'SIGURG', 
			'SIGTSTP', 'SIGCONT', 'SIGCHLD', 'SIGTTIN', 
			'SIGTTOU', 'SIGIO', 'SIGXCPU', 'SIGXFSZ', 
			'SIGVTALRM', 'SIGPROF', 'SIGWINCH', 'SIGINFO', 
			'SIGUSR1', 'SIGUSR2'
		],
		signal_add = function( signame )
		{
			process.on( signame, function(){
				self.delegator[signame]();
			} );
		};
	
	for( var i = 0; i < signames.length; i++ )
	{
		if( Kahana.TypeOf( this.delegator[signames[i]], Kahana.T_FUNC ) ){
			signal_add( signames[i] );
		}
	}
};

Router.prototype.Add = function( uri, directive )
{
	if( Kahana.TypeOf( uri, Kahana.T_STR ) && 
		Kahana.InstanceOf( directive, Object ) )
	{
		var ary,tmp,len;
		
		// console.log( 'directive: ' + uri );
		// normalized
		uri = package.path.normalize( '/' + uri ).replace( /\/+$/, '' );
		if( !uri ){ uri = '/'; }
		ary = uri.split('/');
		ary.shift();
		len = ary.length;
		tmp = '';
		// initialize direvtives uri
		for( var i = 0; i < len; i++ )
		{
			tmp += '/' + ary[i];
			// console.log( 'tmp: ' + tmp );
			if( !this.directives[tmp] ){
				this.directives[tmp] = {};
			}
		}
		
		for( var p in directive ){
			this.directives[uri][p] = directive[p];
		}
	}
};

Router.prototype.TableAdd = function( table )
{
	for( var p in table ){
		this.Add( p, table[p] );
	}
};

Router.prototype.Remove = function( route )
{
	if( this.route[route] ){
		delete this.route[route];
	}
};

Router.prototype.Finalize = function()
{
	var self = this,
		ary = [],
		mergeDirective = function( merge, uri )
		{
			var parent = self.directives[uri];
			// console.log( "\tparent uri: " + uri );
			
			for( var p in parent )
			{
				// console.log( "\t\tparent." + p + ': ' + parent[p] + ", child." + p + ': ' + merge[p] );
				if( merge[p] )
				{
					if( !Kahana.InstanceOf( merge[p], Array ) ){
						merge[p] = [].concat( merge[p] );
					}
					merge[p].unshift( parent[p] );
				}
				else {
					merge[p] = ( !Kahana.InstanceOf( parent[p], Array ) ) ? [].concat( parent[p] ) : parent[p];
				}
				// console.log( "\t\t merge." + p + ': ' + merge[p] );
			}
		};
	
	// add uri
	for( var p in this.directives ){
		ary.push( p );
	}
	// delete current routing table
	delete this.route;
	// create routing table
	this.route = [];
	while( ary.length )
	{
		var uri = ary.shift(),
			merge = {},
			level = 0;
		
		// console.log( 'URI: ' + uri );
		// set current uri directive
		for( var p in this.directives[uri] ){
			merge[p] = [];
			merge[p].push( this.directives[uri][p] );
		}
		
		uri = uri.split('/');
		// set level 1st if root-uri
		level = ( uri[1] ) ? uri.length : 1;
		
		//console.log( 'level:' + level + ' -> ' + ( ( level == 1 ) ? '/' : uri[uri.length-1] ) + ' <- ' + uri.join('/') );
		
		// create level object
		if( !this.route[level] ){
			this.route[level] = {};
		}
		// insert uri into routing table
		if( level == 1 ){
			this.route[level]['/'] = merge;
		}
		else {
			this.route[level][uri[uri.length-1]] = merge;
		}
		
		// add parent directives
		while( uri.length ){
			// remove tail
			uri.pop();
			mergeDirective( merge, uri.join('/') );
		}
		// if not root-uri
		if( level != 1 ){
			mergeDirective( merge, '/' );
		}
	}
	// console.log( "route: \n" + require('util').inspect( this, true, 10 ) );
};

Router.prototype.Directive = function( route )
{
	var uri = route.split('/'),
		directive = undefined,
		methods = undefined,
		level,path;
	
	// search directive
	uri[0] = '/';
	// remove null-path 
	// uri[1] is null if uri is /
	if( !uri[1] ){ uri.pop(); }
	while( ( level = uri.length ) )
	{
		path = uri.pop();
		if( this.route[level] && this.route[level][path] ){
			directive = this.route[level][path];
			break;
		}
	}
	
	if( directive )
	{
		var i = 0;
		
		methods = [];
		for( var p in directive ){
			methods[i++] = { method:p, args:directive[p] };
		}
		
		if( !methods.length ){
			delete methods;
		}
	}
	
	return methods;
};

Router.prototype.Run = function( uri, tick, ctx )
{
	var self = this,
		methods = this.Directive( uri ),
		execute = function( idx, last, wrap, runNext )
		{
			if( Kahana.TypeOf( self.delegator[wrap.methods[idx].method], Kahana.T_FUNC ) ){
				self.delegator[wrap.methods[idx].method]( wrap.uri, wrap.ctx, wrap.methods[idx].method, wrap.methods[idx].args, last, runNext );
			}
			else {
				self.delegator.Detour( wrap.uri, wrap.ctx, wrap.methods[idx].method, wrap.methods[idx].args, last, runNext );
			}
		};
	
	// console.log( 'directive: ' + require('util').inspect( methods ) );
	if( methods ){
		Kahana.Iterate( tick, 0, methods.length - 1, undefined, execute, { uri:uri, ctx:ctx, methods:methods } );
	}
	else {
		this.delegator.Detour( uri, ctx );
	}
};

module.exports = Router;

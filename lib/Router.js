/*
	Router.js
	author: masatoshi teruya
	email: mah0x211@gmail.com
	copyright (C) 2011, masatoshi teruya. all rights reserved.
	
	CREATE ROUTER:
		var router = new Router( delegator );
		delegator must implement following methods: 
			delegator.prototype.Detour( uri, ctx, method-name, args );
			
	ADDING ROUTING TABLE
		router.Set( routing_table_format:Object );
	
	ROUTING TABLE FORMAT:
		{
			"/path/to/url1": {
				"method1": "args",
				"method2": ["args"],
				"method3": { "arg": val },
				...
			},
			"/path/to/url2": {
				"method1": "args",
				"method2": ["args"],
				"method3": { "arg": val },
				...
			},
			...
		}
	
	RUN ROUTE:
		router.run( '/path/to/uri1', context:Object );
			if found directive for route:'/path/to/uri1'
				if defined function delegate.method1
					delegate.method1( uri, ctx, method1, args, last, runNext );
				else
					delegate.Detour( uri, ctx, method1, args, last, runNext );
			else
				delegate.Detour( uri, ctx, method1, args, last, runNext );
*/
var package = {
		path: require('path'),
	},
	Kahana = require( __dirname + '/Kahana' );

Kahana.Inherits( Router, Kahana );
function Router( delegator )
{
	this.directives = {};
	
	if( typeof delegator.Detour !== 'function' ){
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
		if( typeof this.delegator[signames[i]] === 'function' ){
			signal_add( signames[i] );
		}
	}
};

Router.prototype.Add = function( uri, directive )
{
	if( typeof uri === 'string' && directive instanceof Object ){
		this.directives[uri] = directive;
	}
};

Router.prototype.Set = function( obj )
{
	var path,p;
	
	for( p in obj ){
		path = p.replace( /\/{2,}/g, '/' ).replace( /\/+$/, '' );
		this.Add( ( path.length ) ? path : '/', obj[p] );
	}
};

Router.prototype.Remove = function( uri )
{
	if( this.directives[uri] ){
		delete this.directives[uri];
	}
};

Router.prototype.Directive = function( route )
{
	var uri = route.replace( /\/{2,}/g, '/' ).replace( /\/+$/, '' ).split('/'),
		path = '',
		methods = [],
		len,p,
		pushMethod = function( obj )
		{
			if( obj && obj instanceof Object )
			{
				for( p in obj ){
					methods.push( { name:p, args:obj[p] } );
				}
			}
		};
	
	// root directive
	pushMethod( this.directives['/'] );
	// search directive
	if( uri[0] === '' ){
		uri.shift();
	}
	len = uri.length;
	while( len-- ){
		path += '/' + uri.shift();
		pushMethod( this.directives[path] );
	}
	
	return ( methods.length ) ? methods : undefined;
};

Router.prototype.Run = function( uri, tick, ctx )
{
	var self = this,
		methods = this.Directive( uri ),
		execute = function( idx, last, wrap, runNext )
		{
			if( typeof self.delegator[wrap.methods[idx].name] === 'function' ){
				self.delegator[wrap.methods[idx].name]( wrap.uri, wrap.ctx, wrap.methods[idx].name, wrap.methods[idx].args, last, runNext );
			}
			else {
				self.delegator.Detour( wrap.uri, wrap.ctx, wrap.methods[idx].name, wrap.methods[idx].args, last, runNext );
			}
		},
		// if delegator has DeadEnd method
		deadend = ( typeof self.delegator.DeadEnd === 'function' ) ? function(){
			self.delegator.DeadEnd.apply( self.delegator, arguments );
		} : undefined;
	
	if( methods ){
		Kahana.Iterate( tick, 0, methods.length - 1, deadend, execute, { uri:uri, ctx:ctx, methods:methods } );
	}
	else if( deadend ){
		this.delegator.DeadEnd( uri, ctx );
	}
	else {
		this.delegator.Detour( uri, ctx );
	}
};

module.exports = Router;

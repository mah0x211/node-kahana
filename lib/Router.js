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
		var order,items,ary,tmp,len;
		
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
				this.directives[tmp] = { order:[], items:[] };
			}
		}
		
		order = this.directives[uri].order;
		items = this.directives[uri].items;
		for( var p in directive ){
			order.push(p);
		}
		for( var i = 0; i < order.length; i++ ){
			items.push( directive[order[i]] );
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
			var directive = self.directives[uri];
			
			if( directive ){
				merge.order = directive.order.concat( merge.order );
				merge.items = directive.items.concat( merge.items );
			}
		};
	
	// delete current routing table
	delete this.route;
	// create routing table
	this.route = [];
	console.log('');
	// add uri
	for( var path in this.directives )
	{
		var uri = path.split('/'),
			merge = { order:[], items:[] },
			// set level 1st if root-uri
			level = ( uri[1] ) ? uri.length : 1;
		
		// console.log( 'URI: ' + path );
		// create level object if undefined
		if( !this.route[level] ){
			this.route[level] = {};
		}
		
		// insert uri into routing table
		if( level == 1 ){
			this.route[level]['/'] = merge;
		}
		else
		{
			this.route[level][uri[uri.length-1]] = merge;
			// add parent directives
			while( uri.length )
			{
				mergeDirective( merge, uri.join('/') );
				// remove tail
				uri.pop();
			}
		}
		mergeDirective( merge, '/' );
	}
};

Router.prototype.Directive = function( route )
{
	var uri = route.split('/'),
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
			methods = this.route[level][path];
			break;
		}
	}
	

	return methods;
};

// MARK: i have to add cleanup method
Router.prototype.Run = function( uri, tick, ctx )
{
	var self = this,
		methods = this.Directive( uri ),
		execute = function( idx, last, wrap, runNext )
		{
			if( Kahana.TypeOf( self.delegator[wrap.methods.order[idx]], Kahana.T_FUNC ) ){
				self.delegator[wrap.methods.order[idx]]( wrap.uri, wrap.ctx, wrap.methods.order[idx], wrap.methods.items[idx], last, runNext );
			}
			else {
				self.delegator.Detour( wrap.uri, wrap.ctx, wrap.methods.order[idx], wrap.methods.items[idx], last, runNext );
			}
		},
		// if delegator has DeadEnd method
		deadend = ( Kahana.TypeOf( self.delegator.DeadEnd, Kahana.T_FUNC ) ) ? function(){
			self.delegator.DeadEnd.apply( self.delegator, arguments );
		} : undefined;
	
	if( methods ){
		Kahana.Iterate( tick, 0, methods.order.length - 1, deadend, execute, { uri:uri, ctx:ctx, methods:methods } );
	}
	else {
		this.delegator.Detour( uri, ctx );
	}
};

module.exports = Router;

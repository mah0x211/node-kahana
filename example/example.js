var net = require('net'),
	util = require('util'),
	pg = require('pg'),
	kahana = require('Kahana');

function Server( addr, port )
{
	this.addr = addr;
	this.port = port;
	this.core = null;
	
	/** add observer:
	* NotificationCenter.AddObserver( notification:string, observer, method_name:string );
	*/
	kahana.NotificationCenter.AddObserver( 'Listen', this, 'Listen' );
	kahana.NotificationCenter.AddObserver( 'WriteOut', this, 'WriteOut' );
};

Server.prototype.Listen = function( sender, notify, obj )
{
	console.log( 'receive notify: ' + notify + ' -> Listen' );
	
	var self = this;
	
	this.core = net.createServer();
	this.core.on( 'connection', function( sockObj ){ self.onConnect( sockObj ); } );
	this.core.listen( this.port, this.addr );
	
	console.log( 'Staring server running at ' + this.addr + ':' + this.port );
};

Server.prototype.onConnect = function( sockObj )
{
	console.log( 'on connect: ' + sockObj.remoteAddress );
	
	var self = this;
	
	// event
	sockObj.on( 'error', function( dataObj ){ self.onError( this, dataObj ); } );
	sockObj.on( 'data', function( dataObj ){ self.onData( this, dataObj ); } );
	sockObj.on( 'close', function( failed ){ self.onClose( this, failed ); } );
};

Server.prototype.onError = function( sockObj, errObj )
{
	console.log( 'on error' );
	console.log( util.inspect( errObj ) );
};

Server.prototype.onClose = function( sockObj, isFailed )
{
	if( isFailed ){
		console.log( 'on close: failed to data transferring.' );
	}
	else {
		console.log( 'on close' );
	}
};

Server.prototype.onData = function( sockObj, dataObj )
{
	console.log( 'on data' );
	/** post notify: Incoming
	* NotificationCenter.PostNotification( sender, notification:string, userdata:any_type );
	*/
	kahana.NotificationCenter.PostNotification( this, 'Incoming', { sock:sockObj, data:dataObj } );
};

Server.prototype.WriteOut = function( sender, notify, obj )
{
	console.log( 'receive notify: ' + notify + ' -> WriteOut' );
	obj.sock.write( JSON.stringify( obj.msg ) );
	obj.sock.end();
};


function Logic()
{
	var self = this;
	var conf = {
		host: '127.0.0.1',
		port: 5432,
		user: 'username',
		password: 'password',
		database: 'dbname'
	};
	
	this.client = null;
	
	// add observer
	kahana.NotificationCenter.AddObserver( 'Initialize', this, 'DropTable' );
	kahana.NotificationCenter.AddObserver( 'Incoming', this, 'InsertTable' );
	kahana.NotificationCenter.AddObserver( 'ResultSet', this, 'SelectTable' );
	
	console.log( 'database connect to ' + conf.host + ':' + conf.port + '/' + conf.database );
	pg.connect( conf, function( errObj, clientObj )
	{
		if( errObj ){
			throw Error( "failed to pg.connect():" + util.inspect( errObj ) );
		}
		else {
			console.log( 'connected' );
			self.client = clientObj;
			// notify
			kahana.NotificationCenter.PostNotification( self, 'Initialize', null );
		}
	} );

	return this;
};


Logic.prototype.DropTable = function( sender, notify, obj )
{
	console.log( 'receive notify: ' + notify + ' -> DropTable');
	
	var self = this;
	
	this.client.query( "DROP TABLE kahana_sample;", function( errObj, rowObj ){
		self.CreateTable();
	} );
};

Logic.prototype.CreateTable = function()
{
	console.log( 'CreateTable: kahana_sample' );
	var self = this;
	
	this.client.query( "CREATE TABLE kahana_sample ( \
						id serial primary key, \
						log timestamp not null default current_timestamp, \
						addr varchar not null, \
						req varchar not null );", function( errObj, rowObj ){
		if( errObj ){
			throw Error( JSON.stringify( errObj ) );
		}
		else {
			// post notify: Listen
			kahana.NotificationCenter.PostNotification( self, 'Listen', null );
		}
	} );
};

Logic.prototype.InsertTable = function( sender, notify, obj )
{
	console.log( 'receive notify: ' + notify + ' -> InsertTable' );
	
	var self = this;
	
	this.client.query( "INSERT INTO kahana_sample ( addr, req ) VALUES ( $1, $2 );", 
						[obj.sock.remoteAddress, JSON.stringify( obj.data.toString('utf8') )],
						function( errObj, rowObj ){
		// post notify
		if( errObj ){
			kahana.NotificationCenter.PostNotification( self, 'WriteOut', { sock:obj.sock, msg:errObj } );
		}
		else {
			self.SelectTable( obj );
		}
	} );
};

Logic.prototype.SelectTable = function( obj )
{
	console.log( 'SelectTable: kahana_sample' );
	
	var self = this;
	
	this.client.query( "SELECT * FROM kahana_sample ORDER BY id DESC LIMIT 50", function( errObj, rowObj )
	{
		// notify
		if( errObj ){
			kahana.NotificationCenter.PostNotification( self, 'WriteOut', { sock:obj.sock, msg:errObj } );
		}
		else {
			kahana.NotificationCenter.PostNotification( self, 'WriteOut', { sock:obj.sock, msg:rowObj } );
		}
	} );
};


new Logic();
new Server( '127.0.0.1', 1978 );

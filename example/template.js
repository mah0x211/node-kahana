var util = require('util'),
	fs = require('fs'),
	Kahana = require('Kahana');

var cs = new Kahana.ClearSilver;

function Render( tmpl )
{
	var n = ( Number( process.argv[2] ) ) ? +process.argv[2] : 0;
	var ms = +new Date();
	
	if( process.argv[3] ){
		for( var i = 0; i < n; i++ ){
			cs.renderString( tmpl, { items:['foo', 'bar', 'baz'] } );
		}
	}
	else {
		for( var i = 0; i < n; i++ ){
			console.log( cs.renderString( tmpl, { items:['foo', 'bar', 'baz'] } ) );
		}
	}
	console.log( +new Date() - ms + 'ms' + "\n" + util.inspect( process.memoryUsage() ) );	
}

fs.readFile( __dirname + '/hello_cs.txt', function( err, data ){
	if( err ){
		throw err;
	}
	else {
		Render( data.toString() );
	}
} );

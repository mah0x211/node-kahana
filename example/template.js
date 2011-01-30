var util = require('util'),
	Kahana = require('Kahana');

var cs = new Kahana.ClearSilver;
var text = "<?cs var:hello ?> <?cs var:world ?>";
var hdf = { hello:'Hello', world:'World!' };

cs.renderString( text, hdf, function( data ){
console.log( 'renderString: ' + data );
} );

cs.renderFile( __dirname + '/helloworld.txt', hdf, function( data ){
	console.log( 'renderFile: ' + data );
} );

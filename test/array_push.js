var util = require('util');


var base = [];
var len = ( Number( process.argv[2] ) ) ? +process.argv[2] : 0;

console.log( 'array.length: ' + len );
for( var i = 0; i < len; i++ ){
	base.push( 'test' + i );
}
// console.log( base + "\n" );


function AryIdx()
{
	console.log( 'add item with array[index]:' );
	var n = base.length;
	var ms = +new Date();
	var arr = [];
	
	arr.push( 'testing' );
	for( var i = 0; i < n; i++ ){
		arr[i] = base[i];
	}
	console.log( +new Date() - ms + 'ms' + "\n" + util.inspect( process.memoryUsage() ) );
	// console.log( arr );
}


function AryPush()
{
	console.log( 'add item with array.push:' );
	var n = base.length;
	var ms = +new Date();
	var arr = [];
	
	arr.push( 'testing' );
	for( var i = 0; i < n; i++ ){
		arr.push( base[i] );
	}
	console.log( +new Date() - ms + 'ms' + "\n" + util.inspect( process.memoryUsage() ) );
	// console.log( arr );
}

AryIdx();
AryPush();



var util = require('util');


var base = [];
var len = ( Number( process.argv[2] ) ) ? +process.argv[2] : 0;

console.log( 'array.length: ' + len );
// for( var i = 0; i < len; i++ ){
// 	base.push( 'test' + i );
// }
// console.log( base + "\n" );


function AryIdxPush()
{
	console.log( 'push item with array[index]:' );
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
	console.log( 'push item with array.push:' );
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



function AryIdxPop( path )
{
	console.log( 'pop item with array[index]:' );
	var n = +process.argv[2],
		arr = path.split('/'),
		idx = arr.length,tmp,
		ms = +new Date();
	
	for( var i = 0; i < n; i++ )
	{
		while( len ){
			tmp = arr[len-1];
			len--;
		}
	}
	console.log( +new Date() - ms + 'ms' + "\n" + util.inspect( process.memoryUsage() ) );
	// console.log( arr );
}


function AryPop( path )
{
	console.log( 'pop item with array.push:' );
	var n = +process.argv[2],
		arr = path.split('/'),tmp,
		ms = +new Date();
	
	for( var i = 0; i < n; i++ )
	{
		while( arr.length ){
			tmp = arr.pop();
		}
	}
	console.log( +new Date() - ms + 'ms' + "\n" + util.inspect( process.memoryUsage() ) );
	// console.log( arr );
}

AryIdxPop('/path/to/web/page');
console.log('');
AryPop('/path/to/web/page');



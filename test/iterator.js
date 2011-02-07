var fs = require('fs'),
	util = require('util'),
	Kahana = require('../lib/Kahana');

function Run( name, ary )
{
	var cleanup = function( ctx ){
		console.log( 'finish: ' + ctx.name );
	};
	var execute = function( idx, last, ctx, next ){
		// console.log( Math.ceil( Math.random()*2 ) - 1 );
		console.log( ctx.name + '[' + idx + '] -> ' + ctx.ary[idx] + ' -> ' + last );
		if( last ){
			next( ctx );
		}
		else{
			next( Math.ceil( Math.random()*2 ) - 1 );
		}
	};
	
	Kahana.Iterate( true, 0, ary.length-1, cleanup, execute, { name:name, ary:ary } );
}

process.nextTick( function(){
	Run( 'ary:1', [1,2,3,4,5] );
} );
process.nextTick( function(){
	Run( 'ary:2', [6,7,8,9,10] );
} );
process.nextTick( function(){
	Run( 'ary:3', [11,12,13,14,15] );
} );

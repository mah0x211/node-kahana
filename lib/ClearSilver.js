/*
	binding to clearsilver
	author: masatoshi teruya
	email: mah0x211@gmail.com
	copyright (C) 2011, masatoshi teruya. all rights reserved.
*/
var fs = require('fs'),
	Kahana = require( __dirname + '/Kahana' ),
	binding = require('../build/default/clearsilver_binding');

console.log( __dirname );
Kahana.Inherits( ClearSilver, Kahana );
function ClearSilver(){
	this.cs = new binding.Renderer();
}
ClearSilver.prototype = new process.EventEmitter();

ClearSilver.prototype.renderFile = function( file, obj, callback )
{
	var self = this;
	
	if( callback ){
		this.once( 'data', callback );
	}
	
	fs.readFile( file, function( err, data ){
		if( err ){
			self.emit( 'error', err );
		}
		else {
			self.renderString( data.toString(), obj );
		}
	} );
};

ClearSilver.prototype.renderString = function( str, obj, callback )
{
	var hdf = '';
	var Obj2HDF = function( obj )
	{
		for( var p in obj )
		{
			hdf += p;
			if( typeof obj[p] == 'object' ){
				hdf += " {\n";
				Obj2HDF( obj[p] );
				hdf += "\n}\n";
			}
			else if( typeof obj[p] == 'string' && obj[p].match("\n") ){
				hdf += " << EOM\n" + obj[p] + "\nEOM\n";
			}
			else {
				hdf += " = " + obj[p] + "\n";
			}
		}
	};
	Obj2HDF( obj );
	
	if( callback ){
		this.once( 'data', callback );
	}
	
	this.emit( 'data', this.cs.renderString( str, hdf ) );
};

module.exports = ClearSilver;

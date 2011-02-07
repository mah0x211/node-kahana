/*
	binding to ClearSilver
	author: masatoshi teruya
	email: mah0x211@gmail.com
	copyright (C) 2011, masatoshi teruya. all rights reserved.
*/
var Kahana = require( __dirname + '/Kahana' ),
	binding = require( __dirname + '/default/clearsilver_binding');

Kahana.Inherits( ClearSilver, Kahana );
function ClearSilver(){
	this.cs = new binding.Renderer();
};

ClearSilver.prototype.renderString = function( str, obj )
{
	var hdf = '';
	
	if( Kahana.TypeOf( obj, Kahana.T_STR ) ){
		hdf = obj;
	}
	else
	{
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
	}
	
	return this.cs.renderString( str, hdf );
};

module.exports = ClearSilver;

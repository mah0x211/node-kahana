/*
	binding to ClearSilver
	author: masatoshi teruya
	email: mah0x211@gmail.com
	copyright (C) 2011, masatoshi teruya. all rights reserved.
*/
var package = {
		path: require('path')
	},
	Kahana = require( __dirname + '/Kahana' ),
	binding = require( __dirname + '/../build/default/clearsilver_binding');

Kahana.Inherits( ClearSilver, Kahana );
function ClearSilver()
{
	var self = this;
	
	this.cs = new binding.Renderer();
	this.docroot = '';
	this.resolver = function( filepath ){
		return self.docroot + package.path.normalize( ( ( filepath.charAt(0) != '/' ) ? '/' : '' ) + filepath );
	};
};

ClearSilver.prototype.SetDocumentRoot = function( docroot )
{
	this.docroot = docroot;
	if( Kahana.TypeOf( docroot, Kahana.T_STR ) ){
		this.cs.pathResolver( this.resolver );
	}
	else {
		this.cs.pathResolver( null );
	}
};

ClearSilver.prototype.RenderString = function( str, obj )
{
	var self = this,
		hdf = '';
	
	if( Kahana.TypeOf( str, Kahana.T_OBJ ) ){
		str = str.toString('utf8');
	}
	
	if( Kahana.TypeOf( obj, Kahana.T_STR ) ){
		hdf = obj;
	}
	else
	{
		var Obj2HDF = function( obj )
		{
			for( var p in obj )
			{
				if( typeof obj[p] !== 'function' )
				{
					hdf += p;
					if( typeof obj[p] === 'object' ){
						hdf += " {\n";
						Obj2HDF( obj[p] );
						hdf += "\n}\n";
					}
					else if( typeof obj[p] === 'string' && obj[p].match("\n") ){
						hdf += " << EOM\n" + obj[p] + "\nEOM\n";
					}
					else {
						hdf += " = " + obj[p] + "\n";
					}
				}
			}
		};
		Obj2HDF( obj );
	}
	
	return this.cs.renderString( str, hdf );
};

module.exports = ClearSilver;

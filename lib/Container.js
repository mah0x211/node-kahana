/*
	Container.js for node.js
	author: masatoshi teruya
	email: mah0x211@gmail.com
	copyright (C) 2005 - 2011, masatoshi teruya. all rights reserved.
*/
/*
* OBJECT CONTAINER
*/
var Kahana = require( __dirname + '/Kahana' );

Kahana.Inherits( Container, Kahana );
function Container()
{
	var serial = 0;
	var container = {};
	
	this.Obj = function(){
		return container;
	};
	this.Item = function( label ){
		return container[label];
	};
	this.Items = function( callback )
	{
		var nitem = 0;
		if( typeof callback === 'function' )
		{
			for( var p in container ){
				nitem++;
				callback( container[p] );
			}
		}
		return nitem;
	};
	/* Add object to object container */
	this.Add = function( label, data )
	{
		var _label = null;
		
		if( typeof label === 'string' ){
			_label = label;
		}
		else {
			serial++;
			_label = serial.toString();
		}
		
		container[_label] = data;
		
		return _label;
	};
	/* Remove object from object container */
	this.Remove = function( callback )
	{
		var removed = 0;
		var cmp = ( typeof callback === 'function' ) ? callback : function(){ return true; };
		
		if( arguments.length > 1 )
		{
			for( var i = 1; i < arguments.length; i++ )
			{
				if( typeof arguments[i] === 'string' && 
					container[arguments[i]] && cmp( container[arguments[i]] ) ){
					delete container[arguments[i]];
					removed++;
				}
			}
		}
		else
		{
			for( var p in container )
			{
				if( container[p] && cmp( container[p] ) ){
					delete container[p];
					removed++;
				}
			}
		}
		
		return removed;
	};
}

module.exports = Container;

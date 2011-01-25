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

function Container()
{
	var serial = 0;
	var container = {};
	
	this.Obj = function(){
		return container;
	};
	this.Item = function( aLabel ){
		return ( container[aLabel] ) ? container[aLabel] : null;
	};
	this.Items = function( aCallback )
	{
		if( typeof aCallback == Kahana.T_FUNC )
		{
			for( var p in container ){
				aCallback( container[p] );
			}
		}
	};
	/* Add object to object container */
	this.Add = function( aLabel, aData )
	{
		var label = null;
		
		if( aLabel && typeof aLabel == Kahana.T_STR ){
			label = aLabel;
		}
		else {
			serial++;
			label = serial.toString();
		}
		
		container[label] = aData;
		
		return label;
	};
	/* Remove object from object container */
	this.Remove = function( aCallback )
	{
		var removed = 0;
		var cmp = ( typeof aCallback == Kahana.T_FUNC ) ? aCallback : function( a ){ return true; };
		
		if( arguments.length > 1 )
		{
			for( var i = 1; i < arguments.length; i++ )
			{
				if( arguments[i] && typeof arguments[i] == Kahana.T_STR && 
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

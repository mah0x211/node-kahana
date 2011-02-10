/*
	Kahana.js for node.js
	author: masatoshi teruya
	email: mah0x211@gmail.com
	copyright (C) 2005 - 2011, masatoshi teruya. all rights reserved.
*/
function Kahana(){}
Kahana.T_UNDEF = 'undefined',
Kahana.T_NUM = 'number',
Kahana.T_STR = 'string',
Kahana.T_BOOL = 'boolean',
Kahana.T_OBJ = 'object',
Kahana.T_FUNC = 'function';

/**********************
* EXTENDS
**********************/
/* return object type */
Kahana.Inherits = function( class, parent )
{
	var Traits = function(){};
	var classMethods = ['Class','GetInstance'];
	
	Traits.prototype = parent.prototype;
	class.prototype = new Traits();
	class.prototype.constructor = class;
	
	// add class methods
	for( var i = 0; i < classMethods.length; i++ ){
		class[classMethods[i]] = parent[classMethods[i]];
	}
	/*
	for( var p in parent )
	{
		if( typeof class[p] == this.T_UNDEF ){
			class[p] = parent[p];
		}
	}
	*/
};

Kahana.prototype.Class = function()
{
	return Kahana.Class( ( arguments.length ) ? arguments[0] : this );
};

Kahana.Class = function()
{
	var ret = null;
	var target = ( arguments.length ) ? arguments[0] : this;
	
	if( target.constructor && target.constructor.toString().match( /^\s*function\s+(.+?)[()]/ ) ){
		ret = RegExp.$1;
	}
	else {
		ret = 'unknown class';
	}
	
	return ret;
};

/***************************
* SINGLETON
***************************/
/* Singleton class initializer */
Kahana.prototype.Initialize = function(){
/*
if your subclass needs to singleton, use below.

	return this.BehaveSingleton(aInstanceName);

And, SubClass should be implementing [SubClass.prototype.Initialize] method
*/
};
/* DO NOT OVERWRITE THIS METHOD ON SUBCLASS */
Kahana.prototype.BehaveSingleton = function()
{
	var self = this.constructor;
	
	if( self._self || self._FROM_GETINSTANCE_ == null ){
		throw Error( '[' + this.Class() + '] you should call [' + this.Class() + '.GetInstance()] method.' );
		return null;
	}
	
	delete self._FROM_GETINSTANCE_;
	self._self = this;
	self._self.Initialize();
	
	return self._self;
};
/* DO NOT OVERWRITE THIS METHOD ON SUBCLASS */
Kahana.GetInstance = function()
{
	if( this._self ){
		return this._self;
	}
	this._FROM_GETINSTANCE_ = 1;
	return new this();
};

/*
* OBJECT METHOD
*/
/* type = [number, string, boolean, object, function, undefined] */
Kahana.TypeOf = function()
{
	if( arguments.length % 2 ){
		throw Error( 'method parameter should be even number. e.g. Kahana.TypeOf( arg1:any, type:string, arg2, type:string, ... )' );
	}
	
	for( var i = 0; i < arguments.length; i++ )
	{
		if( arguments[i] == null )
		{
			if( this.T_UNDEF != String( arguments[i+1] ).toLowerCase() ){
				return false;
			}
		}
		else if( String( typeof arguments[i] ).toLowerCase() != String( arguments[i+1] ).toLowerCase() ){
			return false;/*{ obj:arguments[i], type:arguments[i+1] }; */
		}
		i++;
	}
	
	return true;
};

/* return instance type */
Kahana.InstanceOf = function ( obj, itype )
{
	var type = (typeof itype).toLowerCase();
	
	if( type != this.T_FUNC && type != this.T_OBJ ){
		throw Error( 'Kahana.InstanceOf( obj:object, type:[function|object]' );
	}
	
	return ( obj instanceof Object && obj instanceof itype );
};


Kahana.ObjectValForKey = function( obj, key )
{
	var val = null;
	var finder = function( _obj )
	{
		if( this.TypeOf( _obj, this.T_OBJ ) && key.length > 0 ){
			val = _obj[key.shift()];
			finder( val );
		}
	};
	
	key = key.split('.');
	finder( obj );
	
	return ( key.length > 0 ) ? null : val;
};


/*
* SORT FUNCTIONS
*/
Kahana.SortAsc = function( l, r ){
	return ( l < r ) ? -1 : ( ( l > r ) ? 1 : 0 );
};
Kahana.SortDesc = function( l, r ){
	return ( l > r ) ? -1 : ( ( l < r ) ? 1 : 0 );
};
/*
* ARRAY FUNCTIONS 
*/
Kahana.DeleteIdxOfArray = function( ary, idx )
{
	return ( ary.slice( 0, idx ) ).concat( ary.slice( idx + 1 ) );
};

Kahana.Iterate = function( tick, origin, dest, cleanup, task, ctx )
{
	if( origin != dest )
	{
		var checker;
		var invokeNext = function( ontick )
		{
			if( ontick === true ){
				process.nextTick( checker );
			}
			else{
				checker();
			}
		};
		
		// up
		if( origin < dest )
		{
			checker = function()
			{
				if( ( origin + 1 ) > dest ){
					task( dest, true, ctx, cleanup );
				}
				else {
					task( origin++, false, ctx, invokeNext );
				}
			};
		}
		// down
		else
		{
			checker = function()
			{
				if( ( origin - 1 ) < dest ){
					task( dest, true, ctx, cleanup );
				}
				else {
					task( origin--, false, ctx, invokeNext );
				}
			}
		}
		invokeNext( tick );
	}
};


module.exports = Kahana;
module.exports.Container = require( __dirname + '/Container' );
module.exports.NotificationCenter = require( __dirname + '/NotificationCenter' );
module.exports.ClearSilver = require( __dirname + '/ClearSilver' );
module.exports.Router = require( __dirname + '/Router' );
module.exports.Server = require( __dirname + '/Server' );

/*
	NotificationCenter.js for node.js
	author: masatoshi teruya
	email: mah0x211@gmail.com
	copyright (C) 2005 - 2011, masatoshi teruya. all rights reserved.
*/

var Kahana = require( __dirname + '/Kahana' );
var Container = require( __dirname + '/Container' );

/*
	MARK: Notification (internal use only)
*/
Kahana.Inherits( Notification, Kahana );
function Notification( notify, observer, methodName, obj )
{
	this._notify = notify;
	this._observer = observer;
	this._method = methodName;
	this._object = obj;
}
/* Compare observer */
Notification.prototype.IsObserver = function( observer )
{
	return ( this._observer == observer );
};
Notification.prototype.CompareWithObserver = function( observer, obj )
{
	return ( ( obj != null ) ? 
			( ( this._object == obj ) && ( this._observer == observer ) ) :
			( this._observer == observer ) );
};

/* Notify messages */
Notification.prototype.Notify = function( sender, obj )
{
	/* call registered method */
	if( Kahana.TypeOf( this._observer[this._method], Kahana.T_FUNC ) ){
		this._observer[this._method]( sender, this._notify, obj );
	}
	/* if observer method not implemented */
	else {
		console.log( Error( 'observer:' + this.Class( this._observer ) + ' method:' + this._method + ' not implemented for notification:' + this._notify ) );
	}
};


/*
	MARK: NotificationCenter (Singleton)
*/
// NotificationCenter.Inherits( Kahana );
Kahana.Inherits( NotificationCenter, Kahana );
function NotificationCenter(){
	return this.BehaveSingleton();
};

NotificationCenter.prototype.Initialize = function()
{
	this.defaultCenter = new Container();
	// EventCenter.Add( window, 'load', null, function(){ NotificationCenter.PostNotification( this, 'WindowLoad', arguments ); } );
	// EventCenter.Add( window, 'resize', null, function(){ NotificationCenter.PostNotification( this, 'WindowResize', arguments ); } );
};
/*
* ADD OBSERVER
*/
/* Adding and Removing observer method */
NotificationCenter.AddObserver = function( notify, observer, methodName, obj )
{
	// check args
	if( Kahana.TypeOf( notify, Kahana.T_STR, observer, Kahana.T_OBJ, methodName, Kahana.T_STR ) != true ){
		throw Error( 'NotificationCenter.AddObserver( notify:string, observer:object, methodName:string, obj:[option:any type] )' );
	}
	/*
	// check method implemented
	else if( !Kahana.TypeOf( observer[methodName], Kahana.T_FUNC ) ){
		console.log( Error( 'observer:' + Kahana.Class( observer ) + ' method:' + methodName + ' not implemented for notification:' + notify ) );
	}
	*/
	// add to center
	else
	{
		var defaultCenter = this.GetInstance().defaultCenter;
		var arr = defaultCenter.Item( notify );
		
		if( !arr || !( arr instanceof Array ) ){
			arr = [];
			/* Add notification array */
			defaultCenter.Add( notify, arr );
		}
		/* create new notification object */
		arr.push( new Notification( notify, observer, methodName, obj ) );
	}
};


/*
* REMOVE OBSERVER
*/
/* Removing observer from all notification */
NotificationCenter.RemoveObserver = function( observer )
{
	if( !Kahana.TypeOf( observer, Kahana.T_OBJ ) ){
		throw Error( 'NotificationCenter.RemoveObserver( observer:object' );
	}
	else
	{
		var defaultCenter = NotificationCenter.GetInstance().defaultCenter;
		
		defaultCenter.Items( function( item )
		{
			var arr = [];
			
			for( var i = 0; i < item.length; i++ )
			{
				if( item[i].IsObserver( observer ) ){
					delete item[i];
				}
				else {
					arr.push( item[i] );
				}
			}
			return false;
		} );
	}
};


/* Removing observer from a notification name. */
NotificationCenter.RemoveObserverFromNotification = function( observer, notify )
{
	if( Kahana.TypeOf( observer, Kahana.T_OBJ, notify, Kahana.T_STR ) != true ){
		throw Error( "Param Error : \n" + 'NotificationCenter.RemoveObserverFromNotification( observer:object, notify:string' );
	}
	else
	{
		var defaultCenter = NotificationCenter.GetInstance().defaultCenter;
		var arr = defaultCenter.Item( notify );
		
		if( arr )
		{
			for( var i = 0; i < arr.length; i++ )
			{
				if( arr[i].IsObserver( observer ) ){
					delete arr[i];
				}
			}
		}
	}
};


/*
* POST NOTIFICATION
*/
/* Post observer method */
NotificationCenter.PostNotification = function( sender, notify, obj )
{
	if( !Kahana.TypeOf( sender, Kahana.T_OBJ, notify, Kahana.T_STR ) ){
		throw Error( 'NotificationCenter.PostNotification( sender:object, notify:string, [obj:option any type]' );
	}
	else
	{
		var defaultCenter = NotificationCenter.GetInstance().defaultCenter;
		var arr = defaultCenter.Item( notify );
		
		if( arr )
		{
			for( var i = 0; i < arr.length; i++ ){
				arr[i].Notify( sender, obj );
			}
		}
	}
};

module.exports = NotificationCenter;
var util = require('util');


function ExtCall(obj){
	obj.cnt++;
}

function MethodCall()
{
	this.cnt = 0;
};

MethodCall.prototype.Call = function(){
	this.cnt++;
};
MethodCall.prototype.Test = function()
{
	var self = this,
		n = +process.argv[2],
		ms,
		imethod = function(){
			self.cnt++;
		};
	
	console.log( 'method call: object.method' );
	this.cnt = 0;
	ms = +new Date();
	for( var i = 0; i < n; i++ ){
		this.Call();
	}
	console.log( +new Date() - ms + 'ms, count: ' + this.cnt + "\n" + util.inspect( process.memoryUsage() ) + "\n" );

	console.log( 'method call: inline method' );
	this.cnt = 0;
	ms = +new Date();
	for( var i = 0; i < n; i++ ){
		imethod();
	}
	console.log( +new Date() - ms + 'ms, count: ' + this.cnt + "\n" + util.inspect( process.memoryUsage() ) + "\n" );

	console.log( 'method call: external method' );
	this.cnt = 0;
	ms = +new Date();
	for( var i = 0; i < n; i++ ){
		ExtCall(this);
	}
	console.log( +new Date() - ms + 'ms, count: ' + this.cnt + "\n" + util.inspect( process.memoryUsage() ) );
};


function Timer()
{
	var self = this,
		n = +process.argv[2],
		i, ms,
		tickCall = function()
		{
			if( i >= n ){
				console.log( +new Date() - ms + 'ms, count: ' + i + "\n" + util.inspect( process.memoryUsage() ) + "\n" );
			}
			else {
				i++;
				process.nextTick( tickCall );
			}
		},
		processTick = function()
		{
			console.log( 'timer : process.nextTick' );
			i = 0;
			ms = +new Date();
			process.nextTick( tickCall );
		},
		interval = function()
		{
			console.log( 'timer : setInterval' );
			i = 0;
			ms = +new Date();
			var id = setInterval( function()
			{
				if( i >= n ){
					clearInterval( id );
					console.log( +new Date() - ms + 'ms, count: ' + i + "\n" + util.inspect( process.memoryUsage() ) + "\n" );
					processTick();
				}
				i++;
			}, 0 );
		};
	
	processTick();
};


function AryIdxPush( base )
{
	console.log( 'push item with array[index]:' );
	var n = +process.argv[2];
	var ms = +new Date();
	var arr = [];
	
	arr.push( 'testing' );
	for( var i = 0; i < n; i++ ){
		arr[i] = base[i];
	}
	console.log( +new Date() - ms + 'ms' + "\n" + util.inspect( process.memoryUsage() ) );
	// console.log( arr );
}

function AryPush( base )
{
	console.log( 'push item with array.push:' );
	var n = +process.argv[2];
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
		idx = arr.length,
		len = n, tmp,
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





function PushTest()
{
	var base = [];
	var len = ( Number( process.argv[2] ) ) ? +process.argv[2] : 0;
	
	for( var i = 0; i < len; i++ ){
		base.push( 'test' + i );
	}
	
	AryIdxPush(base);
	AryPush(base);
}

function PopTest(){
	AryIdxPop('/path/to/web/page');
	console.log('');
	AryPop('/path/to/web/page');
}

function MethodTest()
{
	var obj = new MethodCall();
	
	obj.Test();
}

console.log( 'array.length: ' + +process.argv[2] );

MethodTest();

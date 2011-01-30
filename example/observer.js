var util = require('util'),
	Kahana = require('Kahana');

function Person()
{
	this.count = 0;
	// add observer
	Kahana.NotificationCenter.AddObserver( 'Hi', this, 'Say' );
	Kahana.NotificationCenter.AddObserver( 'Hello', this, 'Say' );
	Kahana.NotificationCenter.AddObserver( 'Hey', this, 'Say' );
	this.Say = function( sender, notify )
	{
		switch( ++this.count ){
			case 1:
				console.log( notify + ': i am terribly sleepy...' );
			break;
			case 2:
				console.log( notify + ': ummm...' );
			break;
			default:
				console.log( notify + ': Zzzz...' );
		}
	};
}

function Dog()
{
	// add observer
	Kahana.NotificationCenter.AddObserver( 'Bow!', this, 'Bark' );
	Kahana.NotificationCenter.AddObserver( 'Hey', this, 'Bark' );
	this.Bark = function( sender, notify ){
		console.log( notify + ': bow-wow!' );
	};
}

function Cat()
{
	// add observer
	Kahana.NotificationCenter.AddObserver( 'Mew', this, 'Meow' );
	Kahana.NotificationCenter.AddObserver( 'Hey', this, 'Meow' );
	this.Meow = function( sender, notify ){
		console.log( notify + ': meow!' );
	};
}

new Person();
new Dog();
new Cat();

Kahana.NotificationCenter.PostNotification( this, 'Hi' );
Kahana.NotificationCenter.PostNotification( this, 'Hello' );
Kahana.NotificationCenter.PostNotification( this, 'Bow!' );
Kahana.NotificationCenter.PostNotification( this, 'Mew' );
Kahana.NotificationCenter.PostNotification( this, 'Hey' );


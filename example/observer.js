var util = require('util'),
	Kahana = require('Kahana');

function Person()
{
	this.count = 0;
	// add observer
	Kahana.NotificationCenter.AddObserver( 'Hi', this, 'Say', 'test1' );
	Kahana.NotificationCenter.AddObserver( 'Hello', this, 'Say', 'test2' );
	Kahana.NotificationCenter.AddObserver( 'Hey', this, 'Say', 'test3' );
	this.Say = function( pass, sender, notify )
	{
		switch( ++this.count ){
			case 1:
				console.log( notify + ': i am terribly sleepy... pass: ' + pass );
			break;
			case 2:
				console.log( notify + ': ummm... pass: ' + pass );
			break;
			default:
				console.log( notify + ': Zzzz... pass: ' + pass );
		}
	};
}

function Dog()
{
	// add observer
	Kahana.NotificationCenter.AddObserver( 'Bow!', this, 'Bark' );
	Kahana.NotificationCenter.AddObserver( 'Hey', this, 'Bark' );
	this.Bark = function( pass, sender, notify ){
		console.log( notify + ': bow-wow!' );
	};
}

function Cat()
{
	// add observer
	Kahana.NotificationCenter.AddObserver( 'Mew', this, 'Meow' );
	Kahana.NotificationCenter.AddObserver( 'Hey', this, 'Meow' );
	this.Meow = function( pass, sender, notify ){
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

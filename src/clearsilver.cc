#include <node.h>
#include <node_events.h>

#include <errno.h>
#include <assert.h>
#include <stdlib.h>
#include <cstring>
#include "ClearSilver/ClearSilver.h"

using namespace v8;
using namespace node;

static inline char *CHECK_NEOERR( NEOERR *ec )
{
	if( ec != STATUS_OK )
	{
		char *retval = NULL;
		STRING estr;
		
		string_init(&estr);
		nerr_error_string( ec, &estr );
		asprintf( &retval, "%s", estr.buf );
		string_clear( &estr );
		free( ec );
		
		return retval;
	}
	
	return NULL;
}

class ClearSilver : public ObjectWrap
{
	public:
		ClearSilver(){};
		~ClearSilver(){};
		static void Initialize( Handle<Object> target);
		
	private:
		static Handle<Value> New (const Arguments& args);
		static NEOERR *cbRender( void *ctx, char *str );
		static char *RenderString( STRING *page, const char *str, char *val );
		static Handle<Value> renderString( const Arguments &args );
};

Handle<Value> ClearSilver::New( const Arguments& args )
{
	HandleScope scope;
	
	(new ClearSilver())->Wrap( args.Holder() ); 
	return args.This();
}

NEOERR *ClearSilver::cbRender( void *ctx, char *str )
{
	if( str ){
		STRING *page = (STRING*)ctx;
		string_append( page, str );
	}
	
	return STATUS_OK;
}

char *ClearSilver::RenderString( STRING *page, const char *str, char *val )
{
	char *estr = NULL;
	size_t len = strlen( str );
	char *parse = (char*)malloc( sizeof(char) * (len + 1) );
	
	if( !parse || !memcpy( (void*)parse, (const void*)str, len ) ){
		estr = strerror( errno );
	}
	else
	{
		NEOERR *ec = NULL;
		HDF *hdf = NULL;
		CSPARSE *csp = NULL;
		
		parse[len] = 0;
		if( !( estr = CHECK_NEOERR( hdf_init( &hdf ) ) ) &&
			( !val || !( estr = CHECK_NEOERR( hdf_read_string( hdf, val ) ) ) ) &&
			!( estr = CHECK_NEOERR( cs_init( &csp, hdf ) ) ) &&
			!( estr = CHECK_NEOERR( cs_register_strfunc( csp, (char*)"url_escape", cgi_url_escape ) ) ) &&
			!( estr = CHECK_NEOERR( cs_register_strfunc( csp, (char*)"html_escape", cgi_html_escape_strfunc ) ) ) &&
			!( estr = CHECK_NEOERR( cs_register_strfunc( csp, (char*)"text_html", cgi_text_html_strfunc ) ) ) && 
			!( estr = CHECK_NEOERR( cs_register_strfunc( csp, (char*)"js_escape", cgi_js_escape ) ) ) && 
			!( estr = CHECK_NEOERR( cs_register_strfunc( csp, (char*)"html_strip", cgi_html_strip_strfunc ) ) ) &&
			!( estr = CHECK_NEOERR( cs_parse_string( csp, parse, len ) ) ) ){
			estr = CHECK_NEOERR( cs_render( csp, page, cbRender ) );
		}
		
		if( hdf ){
			hdf_destroy( &hdf );
		}
		if( parse ){
			cs_destroy( &csp );
		}
		else{
			free( parse );
		}
	}
	
	return estr;
}


Handle<Value> ClearSilver::renderString( const Arguments &args )
{
	HandleScope scope;
	Handle<Value> retval = Null();
	
	if( args.Length() < 1 || args[0]->IsString() == false ){
		retval = ThrowException( Exception::TypeError( String::New( "renderString( template:string, hdf:string" ) ) );
	}
	else
	{
		STRING page;
		char *estr;
		
		string_init( &page );
		estr = RenderString( &page, *String::Utf8Value( args[0] ), ( args[1]->IsString() ) ? *String::Utf8Value( args[1] ) : NULL );
		
		if( estr ){
			retval = ThrowException( Exception::Error( String::New( estr ) ) );
			free( estr );
		}
		else if( page.len ){
			retval = Encode( page.buf, page.len, UTF8 );
		}
		string_clear( &page );
	}
	
	return retval;
}

void ClearSilver::Initialize( Handle<Object> target )
{
	HandleScope scope;
	Local<FunctionTemplate> t = FunctionTemplate::New( New );

	t->SetClassName( String::NewSymbol("Renderer") );
	t->InstanceTemplate()->SetInternalFieldCount(1);
	NODE_SET_PROTOTYPE_METHOD( t, "renderString", renderString );
	target->Set( String::NewSymbol("Renderer"), t->GetFunction() );
}

extern "C" void init( Handle<Object> target )
{
	HandleScope scope;
	ClearSilver::Initialize( target );
};

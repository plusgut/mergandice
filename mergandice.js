#!/usr/bin/env node

var http	= require( "http" );
var fs		= require( "fs" );
var path	= require( "path" );
var url		= require( "url" );
var mime        = require( "mime" );

http.createServer(function (req, res) {
	res.writeNotFound	= writeNotFound;
	res.writeFile		= writeFile;
	var uri = url.parse( req.url).pathname;
	if( uri == "/" ){
		handleIndex( res );
	} else if( uri == "/stylesheet.css" ){
		handleStylesheet( res );
	} else {
		var filename = path.join(process.cwd() , "/source" , uri );
		path.exists( filename, function( exists ){
			if( exists ){
				res.writeFile( filename );
			} else {
				res.writeNotFound();
			}
		});
	}
}).listen( 4020 );

function handleIndex( res ){
	fs.readFile( process.cwd() + "/source/index.html", "utf8", function( err, file ) {
		if ( err ) {
			console.log( err );
		} else {
			if( file.search( /!scripts!/ ) ){
				readDir( "source", "js", "source/js/libs/sproutcore" ,function( results ){
					var scripts = "";
					results.forEach( function( path ) {
						scripts += "<script src='"+ path.replace( /source\//, "" ) + "'></script>\n";
					});
					var content = file.replace( /!scripts!/, scripts );
					res.writeHead( 200, { "Content-Type": "text/html" } );
					res.end( content );
				});
			} else {
				res.writeHead( 200, { "Content-Type": "text/html" } );
				res.end( file );
			}
		}
	});
}


function handleStylesheet( res ){
	readDir( "source", "css", null, function( results ){
		var content = "";
		var i = results.length;
		results.forEach( function( path ){
			fs.readFile( process.cwd() + "/" + path, "utf8", function( err, file ) {
				if ( err ) {
					bb.log( err, "error" );
				} else {
					if( i != results.length ){
						content += "\n\n";
					}
					content += "/* Content of " +path.replace( /source\//, "" ) + " */\n\n";
					content += file;
				}
			
				if( !--i ){
					res.writeHead( 200, { "Content-Type": "text/css" } );
					res.end( content );
				}
			});
		});
	});
}




function writeNotFound(){
	this.writeHead(404, {"Content-Type": "text/plain"});
        this.end("404 Not Found");
}

function writeFile( filename ){
	var req = this;
	fs.readFile( filename, "binary", function( err, file ) {
		if ( err ) {
			req.writeHead( 500, {"Content-Type": "text/plain"});
			req.write("500 Some intenal error");
			req.end();
		} else {
			var mimeType = mime.lookup( filename );
			req.writeHead( 200, {"Content-Type": mimeType })
			req.end( file, "binary" );
		}
	});
}

function readDir( path, fileType, exclude, cb ){		
	var results = [];
	fs.readdir( process.cwd() + "/" + path, function( err, files ){
		if( err ){
			console.log( err );
		} else {
			var i = files.length;
			files.forEach( function( file ){
				fs.stat( process.cwd() + "/" + path + "/" + file, function( err, stat ){
					if( err ){
						console.log( err, "error" );
					} else {
						var newPath = path + "/" + file;
						if( stat && stat.isDirectory() ){
							if( newPath != exclude ){
								readDir( newPath, fileType, exclude, function( res ){
									results = results.concat( res );
									if( !--i ){
										cb( results );
									}
								});
							} else { 
								if( !--i ){
									cb( results );
								}
							}
						} else {
							var splittedFile = file.split( "." );
							if( splittedFile[ splittedFile.length - 1 ] == fileType ){
								results.push( newPath );
							}
							if( !--i ){
								cb( results );
							}
						}
					}
				})
			})
		}
	})
}

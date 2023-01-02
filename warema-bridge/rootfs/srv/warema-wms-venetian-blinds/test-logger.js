const log = require( "/home/ae/pi/npm/dev/warema-wms-venetian-blinds/lib/wms-vb-logger.js" );

//----------------------------------------------------------------------------
console.log( "starting ..." );
//----------------------------------------------------------------------------

log.addLogFile( "console", "I", ""/*fileWrap*/, "MSm"/*tsFormat*/, []/*filterArray*/ );
//~ log.removeLogFile( "console" );
log.addLogFile( "/home/ae/test.log", "D", "H"/*fileWrap*/, "YMDHMSm l"/*tsFormat*/, ["g", "fo", "Tr"]/*filterArray*/ );
log.addLogFile( "/home/ae/testdaily.log", "D", "D"/*fileWrap*/, "YMDHMSm l"/*tsFormat*/, ["g", "fo", "Tr"]/*filterArray*/ );

setInterval( function(){log.D( "Debug" ); log.T( "Trace" ); log.I( "Info" ); log.W( "Warning" ); log.E( "Error" ); }, 10000 );

//----------------------------------------------------------------------------
console.log( "finished." );
//----------------------------------------------------------------------------

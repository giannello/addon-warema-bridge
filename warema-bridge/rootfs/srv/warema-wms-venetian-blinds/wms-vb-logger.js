//--------------------------------------------------------------------------------------------------
//
// - Logger
//
// log levels:
//   E: Error
//   W: Warning
//   I: Info
//   D: Debug
//   T: Trace
//   
//  function addLogFile( filename, level, fileWrap, prefixFormat, filterArray )
//    filename: File name with absolute path or "console"
//    level: Level for log file
//    fileWrap: 
//       H: keep only one hour, one file per minute ==> file<mm>.ext
//       D: keep only one day, one file per hour ==> file<hh>.ext
//       W: keep one week, one file per weekday ==> file<d>.ext (0=Sun...6=Sat)
//       M: keep one month, one file per day of month ==> file<dd>.ext
//       Y: keep one year, one file per month and day of month ==> file<mmdd>.ext
//    prefixFormat: "DHMSm l"
//       R: Runtime (sec)
//       S: seconds
//       MS: Minutes + Seconds
//       HMS: Hours + Minutes + Seconds
//       DHMS: Date + Hours + Minutes + Seconds
//       MDHMS: Month + Date + Hours + Minutes + Seconds
//       else: YMDHMS --> Year + Month + Date + Hours + Minutes + Seconds
//       additional "m": add milliseconds to tme stamp
//       additional "l": add log level
//    filterArray
//       Array of strings. If not empty or undefined, Message is only output if one of
//       the strings is included in message
//   
//--------------------------------------------------------------------------------------------------

const fs = require('fs');
const logFileInitial = "////initial////";
//--------------------------------------------------------------------------------------------------

// var consoleLevels = "E";
// var consoleTsFormat = "";
var logFiles   = [ { filename:"console", levels:"E", fileWrap:"", prefixFormat:"", filterArray:[] }];
var startUpTs  = new Date();
var gNow       = new Date();

//--------------------------------------------------------------------------------------------------
function removeLogFile( filename ){
	for( var i = 0; i < logFiles.length; i ++ ){
		if( logFiles[i].filename === filename ){
			logFiles.splice( i, 1 );
		}
	}
}

//--------------------------------------------------------------------------------------------------
function addLogFile( filename, level, fileWrap, prefixFormat, filterArray ){
	removeLogFile( filename );
	
	if( !filterArray ){ filterArray = []; };
	
	logFiles.push( { filename:filename, levels:logLevels( level ), fileWrap:fileWrap, prefixFormat:prefixFormat, filterArray:filterArray, filnamePrevious:logFileInitial } );
}


//--------------------------------------------------------------------------------------------------
function prependPrefix( prefixFormat, level, text ){
	
	if( prefixFormat ){
		var prefix;
		
		if( prefixFormat.startsWith( "R" ) ){ // Runtime (sec)
			prefix = ((gNow.getTime() - startUpTs.getTime()) % 100000/1000.0).toString().padStart( 6, ' ' );
		}
		else if( prefixFormat.startsWith( "S" ) ){ // Seconds
			prefix = gNow.getSeconds().toString().padStart( 2, '0' );
		}
		else if( prefixFormat.startsWith( "MS" ) ){ // Minutes + Seconds
			prefix = gNow.getMinutes().toString().padStart( 2, '0' ) +
				":" + gNow.getSeconds().toString().padStart( 2, '0' );
		}
		else if( prefixFormat.startsWith( "HMS" ) ){ // Month + Date + Hours + Minutes + Seconds
			prefix = gNow.getHours().toString().padStart( 2, '0' ) +
				":" + gNow.getMinutes().toString().padStart( 2, '0' ) +
				":" + gNow.getSeconds().toString().padStart( 2, '0' );
		}
		else if( prefixFormat.startsWith( "DHMS" ) ){ // Date + Hours + Minutes + Seconds
			prefix = gNow.getDate().toString().padStart( 2, '0' ) +
				" " + gNow.getHours().toString().padStart( 2, '0' ) +
				":" + gNow.getMinutes().toString().padStart( 2, '0' ) +
				":" + gNow.getSeconds().toString().padStart( 2, '0' );
		}
		else if( prefixFormat.startsWith( "MDHMS" ) ){ // Month + Date + Hours + Minutes + Seconds
			prefix = (gNow.getMonth()+1).toString().padStart( 2, '0' ) +
				"/" + gNow.getDate().toString().padStart( 2, '0' ) +
				" " + gNow.getHours().toString().padStart( 2, '0' ) +
				":" + gNow.getMinutes().toString().padStart( 2, '0' ) +
				":" + gNow.getSeconds().toString().padStart( 2, '0' );
		}
		else { // YMDHMS --> Year + Month + Date + Hours + Minutes + Seconds
			prefix = (gNow.getFullYear()%100).toString().padStart( 2, '0' ) +
				"/" + (gNow.getMonth()+1).toString().padStart( 2, '0' ) +
				"/" + gNow.getDate().toString().padStart( 2, '0' ) +
				" " + gNow.getHours().toString().padStart( 2, '0' ) +
				":" + gNow.getMinutes().toString().padStart( 2, '0' ) +
				":" + gNow.getSeconds().toString().padStart( 2, '0' );
		}

		if( prefixFormat.includes( "m" ) ){ // add milliseconds
			prefix =  prefix + "."+ gNow.getMilliseconds().toString().padStart( 3, '0' );
		}

		if( prefixFormat.includes( "l" ) ){ // add log level
			prefix =  prefix + " "+ level;
		}
		
		if( prefix ){
			text = prefix + " " + text;
		}
	}
	
	return text;
}

//--------------------------------------------------------------------------------------------------
function logLevels( level ){
	var levels = "";
	if( level.includes( "T" ) ){ levels = "TDIWE"; }
	else if( level.includes( "D" ) ){ levels = "DIWE"; }
	else if( level.includes( "I" ) ){ levels = "IWE"; }
	else if( level.includes( "W" ) ){ levels = "WE"; }
	else { levels = "E"; }
	
	return levels;
}

//--------------------------------------------------------------------------------------------------
function logLevel( levels ){
	var ret = "E";
	if( levels.includes( "T" ) ) { ret = "T"; }
	else if ( levels.includes( "D" ) ) { ret = "D"; }
	else if ( levels.includes( "I" ) ) { ret = "I"; }
	else if ( levels.includes( "W" ) ) { ret = "W"; }

	return ret;
}

//--------------------------------------------------------------------------------------------------
function setLogLevel( level ){
	for( var i = 0; i < logFiles.length; i ++ ){
		if( logFiles[i].filename === "console" ){
			logFiles[i].levels = logLevels( level );
		}
	}
}

//--------------------------------------------------------------------------------------------------
function getLogLevel(){
	level = "?";
	for( var i = 0; i < logFiles.length; i ++ ){
		if( logFiles[i].filename === "console" ){
			level = logLevel( logFiles[i].levels );
		}
	}
	return level;
}

//--------------------------------------------------------------------------------------------------
function doLog( level, text ){
	var doFileLog = true;
	var logText = "";
	
	gNow = new Date();

	for( var idxLogFile = 0; idxLogFile < logFiles.length; idxLogFile ++ ){
		if( ( logFiles[idxLogFile].levels.includes( level ) ) || ( level ==="X" ) ){
			if( logFiles[idxLogFile].filterArray.length > 0 ){
				doFileLog = false;
				for( var idxFilter = 0; idxFilter < logFiles[idxLogFile].filterArray.length; idxFilter ++ ){
					
					if( text.includes( logFiles[idxLogFile].filterArray[idxFilter] ) )
					{
						doFileLog = true;
						idxFilter = logFiles[idxLogFile].filterArray.length;
					}
				}
			}
			
			if( doFileLog ){
				logText = prependPrefix( logFiles[idxLogFile].prefixFormat, level, text );
				
				if( logFiles[idxLogFile].filename === "console" ){
					console.log( logText );
				}
				else{
					filename = logFiles[idxLogFile].filename;

					if( logFiles[idxLogFile].fileWrap ){
						wrapExt = '';
						switch( logFiles[idxLogFile].fileWrap ){
							case "H": // keep only one hour, one file per minute
								wrapExt = gNow.getMinutes().toString().padStart( 2, "0" );
								break;
							case "D": // keep only one day, one file per hour
								wrapExt = gNow.getHours().toString().padStart( 2, "0" );
								break;
							case "W": // keep one week, one file per weekday
								wrapExt = gNow.getDay();
								break;
							case "M": // keep one month, one file per day
								wrapExt = gNow.getDate().toString().padStart( 2, "0" );
								break;
							case "Y": // keep one year, one file per month&day
								wrapExt = (gNow.getMonth()+1).toString().padStart( 2, "0" ) + gNow.getDate().toString().padStart( 2, "0" );
								break;
						}
						
						if( wrapExt ){
							tmp = logFiles[idxLogFile].filename.split('.');
							if( tmp.length > 1 ){
								tmp[tmp.length-2] += wrapExt;
							}
							filename = tmp.join('.');
						}
					}
					
					if( ( filename === logFiles[idxLogFile].filnamePrevious ) ||
							( logFileInitial === logFiles[idxLogFile].filnamePrevious ) ){
						fs.appendFile( filename, logText+'\n', 'utf8', (err) => {
								if (err){
									console.log( "Error "+err+" appendig log to "+filename+": "+logText );
								}
							});
					}
					else{
						fs.writeFile( filename, logText+'\n', 'utf8', (err) => {
								if (err){
									console.log( "Error "+err+" writing log "+filename+": "+logText );
								}
							});
					}
					logFiles[idxLogFile].filnamePrevious = filename;
				}
			}
		}
	}
}

//--------------------------------------------------------------------------------------------------
function logE( text ){
	doLog( "E", text );
}

//--------------------------------------------------------------------------------------------------
function logW( text ){
	doLog( "W", text );
}

//--------------------------------------------------------------------------------------------------
function logI( text ){
	doLog( "I", text );
}

//--------------------------------------------------------------------------------------------------
function logT( text ){
	doLog( "T", text );
}

//--------------------------------------------------------------------------------------------------
function logD( text ){
	doLog( "D", text );
}

//--------------------------------------------------------------------------------------------------
function logXXX( text ){
	doLog( "X", text );
}

//--------------------------------------------------------------------------------------------------
exports.removeLogFile = removeLogFile;
exports.addLogFile = addLogFile;
exports.setLogLevel = setLogLevel;
exports.getLogLevel = getLogLevel;
exports.E = logE;
exports.W = logW;
exports.I = logI;
exports.T = logT;
exports.D = logD;
exports.XXX = logXXX;

//--------------------------------------------------------------------------------------------------



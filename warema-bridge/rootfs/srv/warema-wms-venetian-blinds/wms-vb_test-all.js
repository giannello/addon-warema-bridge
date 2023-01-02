//----------------------------------------------------------------------
const WmsVbStickUsb = require( "warema-wms-venetian-blinds" );

const testComName = "/dev/ttyUSB0";
var exitTimeout;

//----------------------------------------------------------------------------
function setExitTimeout(){
  if( exitTimeout ){
    clearTimeout( exitTimeout );
  }
  
  exitTimeout = setTimeout( function(){ console.log( "exit timer." ); process.exit(); }, 60*1000 ); //  Exit x msec after last testCallback
}

//----------------------------------------------------------------------------
function testCallback( err, msg ){
  setExitTimeout()
  if( err ){
    console.log( "testCallback err: " + err );
  }
  if( msg ){
    console.log( "testCallback msg: " + JSON.stringify( msg /*, null, 2*/ ) );

    if( msg.topic === "wms-vb-init-completion" ){
      //~ {
        //~ stickUsb.scanDevices();
      //~ }
      
      //~ {
        //~ stickUsb.vnBlindSetPosition( "Living room 1", 0, -100 );
      //~ }
      
      //~ {
        // stickUsb.vnBlindGetPosition( "Kitchen right" );
        // stickUsb.setPosUpdInterval( 6000 );
        //~ stickUsb.vnBlindSetPosition( "Kitchen right", 80, 0 );
        //~ setTimeout( function(){ stickUsb.vnBlindSetPosition( "Kitchen right", 60, -100 ) }, 15000 );
        
        //~ setTimeout( function(){ stickUsb.vnBlindSetPosition( "Living room 1", 100, 100 ) }, 20000 );
        //~ setTimeout( function(){ stickUsb.vnBlindSetPosition( "Living room 1", 100, 100 ) }, 30000 );
      //~ }

      //~ {
        //~ // Test STOP 
        //~ setTimeout( function(){ console.log( "-- A ----------" ); stickUsb.vnBlindSetPosition( "Kitchen left",   0, -100 ) },   100 );
        //~ setTimeout( function(){ console.log( "-- B ----------" ); stickUsb.vnBlindGetPosition( "Kitchen left" ) },              900 );
        //~ setTimeout( function(){ console.log( "-- C ----------" ); stickUsb.vnBlindSetPosition( "Kitchen left", 100,  100 ) }, 10000 );
        //~ setTimeout( function(){ console.log( "-- D ----------" ); stickUsb.vnBlindStop       ( "Kitchen left" ) },            12500 );
        //~ setTimeout( function(){ console.log( "-- E ----------" ); stickUsb.vnBlindGetPosition( "Kitchen left" ) },            13000 );
        
        //~ setTimeout( function(){ console.log( "-- 01 ----------" ); stickUsb.vnBlindStop( "Living room 1" ) }, 100 );
      //~ }

      //~ {
        //~ // Test waveRequest 
        //~ setTimeout( function(){ console.log( "-- A ----------" ); stickUsb.vnBlindWaveRequest( "Living room 1" ) },   1000 );
        //~ setTimeout( function(){ console.log( "-- A ----------" ); console.log( JSON.stringify(stickUsb.vnBlindGetStatus( "Living room 1" ), null, 2 ) ); }, 10000 );
      //~ }

      {
        //~ // Test vnBlindSlatUp() / vnBlindSlatDown()
        //~ stickUsb.setPosUpdInterval( 5000 );
        //~ setTimeout( function(){ console.log( JSON.stringify(stickUsb.vnBlindGetStatus( "Living room 1" ), null, 2 ) ); }, 20 );
        //~ setTimeout( function(){ stickUsb.vnBlindSetPosition( "Living room 1", 40, 0 ) },  10 );
        //~ setTimeout( function(){ stickUsb.vnBlindSlatUp( "Living room 1" ) },   2000 );
        //~ setTimeout( function(){ stickUsb.vnBlindSlatUp( "Living room 1" ) },   4000 );
        //~ setTimeout( function(){ stickUsb.vnBlindSlatUp( "Living room 1" ) },   6000 );
        //~ setTimeout( function(){ stickUsb.vnBlindSlatUp( "Living room 1" ) },   8000 );
        //~ setTimeout( function(){ stickUsb.vnBlindSlatDown( "Living room 1" ) },10000 );
        //~ setTimeout( function(){ stickUsb.vnBlindSlatDown( "Living room 1" ) },12000 );
        //~ setTimeout( function(){ stickUsb.vnBlindSlatDown( "Living room 1" ) },14000 );
        //~ setTimeout( function(){ stickUsb.vnBlindSlatDown( "Living room 1" ) },16000 );
        //~ setTimeout( function(){ stickUsb.vnBlindSlatDown( "Living room 1" ) },18000 );
        //~ setTimeout( function(){ stickUsb.vnBlindSlatDown( "Living room 1" ) },20000 );
        //~ setTimeout( function(){ stickUsb.vnBlindSlatDown( "Living room 1" ) },22000 );

        //~ setTimeout( function(){ console.log( JSON.stringify(stickUsb.vnBlindGetStatus( "Living room 1" ), null, 2 ) ); }, 24000 );
      }
      
      {
        // Test vnBlindGetStatus()
        stickUsb.setPosUpdInterval( 5000 );
        //~ setTimeout( function(){ console.log( "BlindStatus:\n"+JSON.stringify(stickUsb.vnBlindGetStatus( "Living room 1" ), null, 2 ) ); },  6000 );
        //~ setTimeout( function(){ console.log( "BlindStatus:\n"+JSON.stringify(stickUsb.vnBlindGetStatus( "Living room 1" ), null, 2 ) ); }, 11000 );
        //~ setTimeout( function(){ console.log( "BlindStatus:\n"+JSON.stringify(stickUsb.vnBlindGetStatus( "Living room 1" ), null, 2 ) ); }, 16000 );
        //~ setTimeout( function(){ console.log( "BlindStatus:\n"+JSON.stringify(stickUsb.vnBlindGetStatus( "Living room 1" ), null, 2 ) ); }, 21000 );
        //~ setTimeout( function(){ console.log( "BlindStatus:\n"+JSON.stringify(stickUsb.vnBlindGetStatus( "Living room 1" ), null, 2 ) ); }, 26000 );
      }
      
    }
    if( msg.topic === "wms-vb-scanned-devices" ){
      console.log( "Scanned "+msg.payload.devices.length+" WMS devices:" );
      console.log( "     SNR snrHex Type" );
      for( var i = 0; i < msg.payload.devices.length; i++ ){
        console.log( msg.payload.devices[i].snr.toString().padStart( 8, "0" ) + " " +
                     msg.payload.devices[i].snrHex + " " +
                     msg.payload.devices[i].type + " " + msg.payload.devices[i].typeStr );
      }
    }
  }
  
}

//----------------------------------------------------------------------------
console.log( "starting ..." );
setExitTimeout()

//----------------------------------------------------------------------------
// Test Stick without module Serialport
// stickPlain = new WsmVbStick( 17/*channel*/, process.env.WMS_PANID/*panid*/, process.env.WMS_KEY/*key*/, { autoOpen:false }, testCallback );

//----------------------------------------------------------------------------
// Normal Operation
stickUsb = new WmsVbStickUsb( testComName, 17/*channel*/, 
															process.env.WMS_PANID/*panid*/, 
															process.env.WMS_KEY/*key*/, 
															{}, 
															testCallback );

ki_le = stickUsb.vnBlindAdd( 580911, "Kitchen left" );
ki_ri = stickUsb.vnBlindAdd( 664681, "Kitchen right" );
liv_1 = stickUsb.vnBlindAdd( 636300, "Living room 1" );
liv_2 = stickUsb.vnBlindAdd( 637180, "Living room 2" );
liv_3 = stickUsb.vnBlindAdd( 626216, "Living room 3" );
liv_s = stickUsb.vnBlindAdd( 664711, "Living room side" );
console.log( "Added blinds:\n"+ 
							JSON.stringify( stickUsb.vnBlindsList(), null, 2 ) );

//~ // Removing blinds
//~ {
	//~ liv_d1 = stickUsb.vnBlindAdd( 123456, "dummy1" );
	//~ liv_d2 = stickUsb.vnBlindAdd( 654321, "dummy2" );
	//~ console.log( "with dummy blinds:\n"+ 
								//~ JSON.stringify( stickUsb.vnBlindsList(), null, 2 ) );
	//~ console.log( "No of removed blinds:"+ stickUsb.vnBlindRemove( 123456 ) );
	//~ console.log( "Blnds after removal:\n"+ 
								//~ JSON.stringify( stickUsb.vnBlindsList(), null, 2 ) );
	//~ console.log( "No of removed blinds:"+ stickUsb.vnBlindRemove( "dummy2" ) );
	//~ console.log( "Blnds after removal:\n"+ 
								//~ JSON.stringify( stickUsb.vnBlindsList(), null, 2 ) );
	//~ console.log( "No of removed blinds:"+ stickUsb.vnBlindRemove() );
	//~ console.log( "Blnds after removal:\n"+ 
								//~ JSON.stringify( stickUsb.vnBlindsList(), null, 2 ) );
//~ }

//----------------------------------------------------------------------------
// getting network paramters
//~ stickUsb = new WmsVbStickUsb( testComName, 
                              //~ 17/*channel*/, 
                              //~ "FFFF"/*panid*/, 
                              //~ "00112233445566778899AABBCCDDEEFF"/*key*/, 
                              //~ {} /* options */, 
                              //~ testCallback );

//----------------------------------------------------------------------------
// Listing serial ports with WMS Stick
//~ function listWmsStickSerialPortsCallback( err, msg ){
  //~ if( err ){
    //~ // console.log( "listWmsStickSerialPortsCallback err: " + err );
  //~ }
  
  //~ if( msg ){
    //~ // console.log( "listWmsStickSerialPortsCallback msg: " + JSON.stringify( msg ) );
    //~ console.log( "Found "+msg.payload.portsList.length+" serial port(s) with WMS Stick:" );
    //~ for( var i = 0; i < msg.payload.portsList.length; i ++ ){
      //~ console.log( "  Port: "+msg.payload.portsList[i].path+", Stick version: "+ msg.payload.portsList[i].wmsStickVersion );
    //~ }
  //~ }
//~ }
//~ WmsVbStickUsb.listWmsStickSerialPorts( listWmsStickSerialPortsCallback );

  
//----------------------------------------------------------------------------
console.log( "finished." );

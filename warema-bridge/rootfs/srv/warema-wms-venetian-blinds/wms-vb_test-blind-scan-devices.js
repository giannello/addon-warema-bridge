//----------------------------------------------------------------------
const WmsVbStickUsb = require( "warema-wms-venetian-blinds" );

const testComName = "/dev/ttyUSB0";

//----------------------------------------------------------------------
function testCallback( err, msg ){
  if( err ){
    console.log( "testCallback err: " + err );
  }
  if( msg ){
    console.log( "testCallback msg: " + JSON.stringify( msg ) );

    if( msg.topic === "wms-vb-init-completion" ){
      {
        stickUsb.scanDevices( { autoAssignBlinds: false } );
      }
    }
    if( msg.topic === "wms-vb-scanned-devices" ){
      console.log( "Scanned "+msg.payload.devices.length+
                    " WMS devices:" );
      console.log( "     SNR snrHex Type" );
      for( var i = 0; i < msg.payload.devices.length; i++ ){
        console.log( 
          msg.payload.devices[i].snr.toString().padStart( 8, "0" ) + 
          " " + msg.payload.devices[i].snrHex + 
          " " + msg.payload.devices[i].type + 
          " " + msg.payload.devices[i].typeStr );
      }

      console.log( "finished." );
      process.exit();
    }
  }
  
}

//----------------------------------------------------------------------
console.log( "starting ..." );

stickUsb = new WmsVbStickUsb( testComName, 
                              17/*channel*/, 
                              process.env.WMS_PANID/*panid*/, 
                              process.env.WMS_KEY/*key*/, 
                              {}, /* options */
                              testCallback );

// further demo actions are triggered in function testCallback().

//----------------------------------------------------------------------
const WmsVbStickUsb = require( "warema-wms-venetian-blinds" );

//----------------------------------------------------------------------
console.log( "starting ..." );

// Listing serial ports with WMS Stick
WmsVbStickUsb.listWmsStickSerialPorts( function( err, msg ){
      if( err ){
        console.log( "listWmsStickSerialPortsCallback err: " + err );
      }
      if( msg ){
        console.log( "Found "+msg.payload.portsList.length+
                      " serial port(s) with WMS Stick:" );
        for( var i = 0; i < msg.payload.portsList.length; i ++ ){
          console.log( "  Port: "+msg.payload.portsList[i].path+
                        ", Stick version: "+ 
                        msg.payload.portsList[i].wmsStickVersion );
        }
        console.log( "finished." );
      }
    } );


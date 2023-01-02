//----------------------------------------------------------------------
const WmsVbStickUsb = require( "warema-wms-venetian-blinds" );

const testComName = "/dev/ttyUSB0";

//----------------------------------------------------------------------
function testCallback( err, msg ){
  setExitTimeout()
  if( err ){
    console.log( "testCallback err: " + err );
  }
  if( msg ){
    console.log( "testCallback msg: " + JSON.stringify( msg ) );
  }
  
}

//----------------------------------------------------------------------
console.log( "starting ..." );

// getting network parameters 
// (panid=FFFF, key=00112233445566778899AABBCCDDEEFF)
stickUsb = new WmsVbStickUsb( testComName, 
                              17/*channel*/, 
                              "FFFF"/*panid*/, 
                              "00112233445566778899AABBCCDDEEFF"/*key*/, 
                              {}, /* options */
                              testCallback );

console.log( "finished." );

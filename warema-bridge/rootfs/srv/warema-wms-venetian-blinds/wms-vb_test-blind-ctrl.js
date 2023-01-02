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
      // Enable callback messages for changes of position 
      stickUsb.setPosUpdInterval( 5000 );
      
      // Open blind completely
      setTimeout( function(){ 
          stickUsb.vnBlindSetPosition( "Living room 1", 0, -100 ) 
        }, 
        2000 );

      // Set blind to half way positon with slats set horizontal
      setTimeout( function(){ 
          stickUsb.vnBlindSetPosition( "Living room 1", 50, 0 ) 
        }, 
        10000 );

      // Close blind completely
      setTimeout( function(){ 
          stickUsb.vnBlindSetPosition( "Living room 1", 100, 100 ) 
        }, 
        20000 );

      // Stop move of pecific blind
      setTimeout( function(){ 
          stickUsb.vnBlindStop( "Living room 1" ) 
        }, 
        22000 );

      // Stop move of all blinds
      setTimeout( function(){ 
          stickUsb.vnBlindStop() 
        }, 
        23000 );


      // Tilt slat up
      setTimeout( function(){ 
          stickUsb.vnBlindSlatUp( "Living room 1" ) 
        }, 
        25000 );

      // Tilt slat down
      setTimeout( function(){ 
          stickUsb.vnBlindSlatDown( "Living room 1" ) 
        }, 
        27000 );

      // Get status of stick and blind
      setTimeout( function(){ 
          console.log( "Stick status: \n" + JSON.stringify(
                        stickUsb.getStatus(), null, 2 ) );
          console.log( "Blind status: \n" + JSON.stringify(
                        stickUsb.vnBlindGetStatus( "Living room 1" ), 
                        null, 2 ) );
          process.exit();
        }, 
        29000 );
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

liv_1 = stickUsb.vnBlindAdd( 636300, "Living room 1" );
liv_2 = stickUsb.vnBlindAdd( 637180, "Living room 2" );
liv_3 = stickUsb.vnBlindAdd( 626216, "Living room 3" );
console.log( "Added blinds:\n"+ 
              JSON.stringify( stickUsb.vnBlindsList(), null, 2 ) );

// further demo actions are triggered in function testCallback().

console.log( "finished." );
//----------------------------------------------------------------------

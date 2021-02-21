const WmsVbStickUsb = require('warema-wms-venetian-blinds');
// const fs = require('fs')
// const lineReader = require('line-reader');

const path = '/data/devices'

const settingsPar = {
    wmsChannel   : process.env.WMS_CHANNEL     || 17,
    wmsKey       : process.env.WMS_KEY         || '00112233445566778899AABBCCDDEEFF',
    wmsPanid     : process.env.WMS_PAN_ID      || 'FFFF',
    wmsSerialPort: process.env.WMS_SERIAL_PORT || '/dev/ttyUSB0',
    wsPort       : process.env.WMS_WS_PORT     || 8080,
    wsPath       : process.env.WMS_WS_PATH     || '/'
  };

// var wsApi = new WmsVbWsApi(settingsPar);
var mqtt = require('mqtt')
var client = mqtt.connect(process.env.MQTT_SERVER, {username: process.env.MQTT_USER, password: process.env.MQTT_PASSWORD})

function callback(err, msg) {
  if(err) {
    console.log('ERROR: ' + err);
  }
  if(msg) {
    switch (msg.topic) {
      case 'wms-vb-init-completion':
        stickUsb.setPosUpdInterval(5000);
        stickUsb.scanDevices({autoAssignBlinds: false});
        break
      case 'wms-vb-scanned-devices':
        msg.payload.devices.forEach(element => {
          console.log('Adding device ' + element.snr + ' (type ' + element.type + ')')
          stickUsb.vnBlindAdd(element.snr, element.snr);
          var topic = 'homeassistant/cover/' + element.snr + '/' + element.snr + '/config'
          var payload = {
            name: element.snr,
            command_topic: 'warema/' + element.snr + '/set',
            state_topic: 'warema/' + element.snr + '/state',
            device: {
              identifiers: element.snr,
              manufacturer: "Warema",
              name: "Warema cover"
            },
            position_open: 0,
            position_closed: 100,
            unique_id: element.snr
          }
          console.log('TOPIC: ' + topic);
          console.log('PAYLOAD: ' + JSON.stringify(payload));
          client.publish(topic, JSON.stringify(payload))
        });
        console.log(stickUsb.vnBlindsList())
        break
      default:
        console.log('UNKNOWN MESSAGE: ' + JSON.stringify(msg));
    }
  }
}


 
client.on('connect', function (connack) {
  console.log('Connected to MQTT')
  client.subscribe('warema/#')
})

client.on('error', function (error) {
  console.log('MQTT Error')
  console.log(error.toString())
})

client.on('message', function (topic, message) {
  // message is Buffer
  console.log(topic + ':' + message.toString())
  var device = parseInt(topic.split('/')[1])
  switch (message.toString()) {
    case 'CLOSE':
      stickUsb.vnBlindSetPosition(device, 100)
      break;
    case 'OPEN':
      stickUsb.vnBlindSetPosition(device, 0)
      break;
    case 'STOP':
      stickUsb.vnBlindStop(device)
      break;
    default:
      console.log('Unrecognised command from HA')    
    }
})

var stickUsb = new WmsVbStickUsb( settingsPar.wmsSerialPort, 
  settingsPar.wmsChannel,
  settingsPar.wmsPanid,
  settingsPar.wmsKey,
  {},
  callback);

// setTimeout(function() { 
//     stickUsb.vnBlindSetPosition( "Living room 1", 0, -100 ) 
//   }, 
// 2000 );

// fs.access(path, fs.F_OK, (err) => {
//   if (err) {
//     console.error(err)
//     return
//   }

//   lineReader.eachLine(path, function(line) {
//     console.log(line);
//     stickUsb.vnBlindAdd(line, line);
//   });
// })
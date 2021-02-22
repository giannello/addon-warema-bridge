const warema = require('warema-wms-venetian-blinds');
var mqtt = require('mqtt')

const ignoredDevices = process.env.IGNORED_DEVICES.split(',')

const settingsPar = {
    wmsChannel   : process.env.WMS_CHANNEL     || 17,
    wmsKey       : process.env.WMS_KEY         || '00112233445566778899AABBCCDDEEFF',
    wmsPanid     : process.env.WMS_PAN_ID      || 'FFFF',
    wmsSerialPort: process.env.WMS_SERIAL_PORT || '/dev/ttyUSB0',
  };

function callback(err, msg) {
  if(err) {
    console.log('ERROR: ' + err);
  }
  if(msg) {
    switch (msg.topic) {
      case 'wms-vb-init-completion':
        console.log('Warema init completed')
        stickUsb.setPosUpdInterval(5000);
        stickUsb.scanDevices({autoAssignBlinds: false});
        break
      case 'wms-vb-rcv-weather-broadcast':
        break
      case 'wms-vb-scanned-devices':
        msg.payload.devices.forEach(element => {
          var topic = 'homeassistant/cover/' + element.snr + '/' + element.snr + '/config'
          var availability_topic = 'warema/' + element.snr + '/availability'
          var payload = {}
          if (ignoredDevices.includes(element.snr.toString())) {
            console.log('Ignoring and removing device ' + element.snr + ' (type ' + element.type + ')')
          } else {
            console.log('Adding device ' + element.snr + ' (type ' + element.type + ')')

            var device_name
            switch (parseInt(element.type)) {
              case 6:
                device_name = 'Weather station'
                break
              case 25:
                device_name = 'Vertical awning'
                break
              default:
                console.log('Unrecognized device type: ' + element.type)
                device_name = 'Unknown ' + element.type
                break
            }

            payload = {
              name: element.snr,
              command_topic: 'warema/' + element.snr + '/set',
              state_topic: 'warema/' + element.snr + '/state',
              availability: [
                {topic: 'warema/bridge/state'},
                {topic: availability_topic}
              ],
              device: {
                identifiers: element.snr,
                manufacturer: "Warema",
                name: device_name
              },
              position_open: 0,
              position_closed: 100,
              unique_id: element.snr
            }

            stickUsb.vnBlindAdd(element.snr, element.snr);
            client.publish(availability_topic, 'online', {retain: true})
          }
          client.publish(topic, JSON.stringify(payload))
        });
        console.log(stickUsb.vnBlindsList())
        break
      default:
        console.log('UNKNOWN MESSAGE: ' + JSON.stringify(msg));
    }
  }
}

var client = mqtt.connect(
  process.env.MQTT_SERVER,
  {
    username: process.env.MQTT_USER,
    password: process.env.MQTT_PASSWORD,
    will: {
      topic: 'warema/bridge/state',
      payload: 'offline',
      retain: true
    }
  }
)

client.on('connect', function (connack) {
  console.log('Connected to MQTT')
  client.subscribe('warema/#')
})

client.on('error', function (error) {
  console.log('MQTT Error: ' + error.toString())
})

client.on('message', function (topic, message) {
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

var stickUsb = new warema(settingsPar.wmsSerialPort,
  settingsPar.wmsChannel,
  settingsPar.wmsPanid,
  settingsPar.wmsKey,
  {},
  callback
);

const warema = require('warema-wms-venetian-blinds');
var mqtt = require('mqtt')

const ignoredDevices = process.env.IGNORED_DEVICES ? process.env.IGNORED_DEVICES.split(',') : []
const forceDevices = process.env.FORCE_DEVICES ? process.env.FORCE_DEVICES.split(',') : []

const settingsPar = {
    wmsChannel   : process.env.WMS_CHANNEL     || 17,
    wmsKey       : process.env.WMS_KEY         || '00112233445566778899AABBCCDDEEFF',
    wmsPanid     : process.env.WMS_PAN_ID      || 'FFFF',
    wmsSerialPort: process.env.WMS_SERIAL_PORT || '/dev/ttyUSB0',
  };

var registered_shades = []

function registerDevice(element) {
  var topic = 'homeassistant/cover/' + element.snr + '/' + element.snr + '/config'
  var availability_topic = 'warema/' + element.snr + '/availability'
  var payload = {}
  if (ignoredDevices.includes(element.snr.toString())) {
    console.log('Ignoring and removing device ' + element.snr + ' (type ' + element.type + ')')
  } else {
    console.log('Adding device ' + element.snr + ' (type ' + element.type + ')')

    var model
    switch (parseInt(element.type)) {
      case 6:
        model = 'Weather station'
        break
      case 25:
        model = 'Vertical awning'
        break
      default:
        console.log('Unrecognized device type: ' + element.type)
        model = 'Unknown model ' + element.type
        break
    }

    payload = {
      name: element.snr,
      command_topic: 'warema/' + element.snr + '/set',
      position_topic: 'warema/' + element.snr + '/position',
      set_position_topic: 'warema/' + element.snr + '/set_position',
      availability: [
        {topic: 'warema/bridge/state'},
        {topic: availability_topic}
      ],
      device: {
        identifiers: element.snr,
        manufacturer: "Warema",
        model: model,
        name: element.snr
      },
      position_open: 0,
      position_closed: 100,
      unique_id: element.snr
    }

    stickUsb.vnBlindAdd(parseInt(element.snr), element.snr.toString());
    client.publish(availability_topic, 'online', {retain: true})
  }
  client.publish(topic, JSON.stringify(payload))
}

function callback(err, msg) {
  if(err) {
    console.log('ERROR: ' + err);
  }
  if(msg) {
    switch (msg.topic) {
      case 'wms-vb-init-completion':
        console.log('Warema init completed')
        if (forceDevices) {
          forceDevices.forEach(element => {
            registerDevice({snr: element, type: 25})
          })
        } else {
          stickUsb.scanDevices({autoAssignBlinds: false});
        }
        stickUsb.setPosUpdInterval(30000);
        break
      case 'wms-vb-rcv-weather-broadcast':
        if (registered_shades.includes(msg.payload.weather.snr)) {
          client.publish('warema/' + msg.payload.weather.snr + '/illuminance/state', msg.payload.weather.lumen.toString())
          client.publish('warema/' + msg.payload.weather.snr + '/temperature/state', msg.payload.weather.temp.toString())
        } else {
          var availability_topic = 'warema/' + msg.payload.weather.snr + '/availability'
          var payload = {
            name: msg.payload.weather.snr,
            availability: [
              {topic: 'warema/bridge/state'},
              {topic: availability_topic}
            ],
            device: {
              identifiers: msg.payload.weather.snr,
              manufacturer: 'Warema',
              model: 'Weather Station',
              name: msg.payload.weather.snr
            },
            force_update: true
          }

          var illuminance_payload = {
            ...payload,
            state_topic: 'warema/' + msg.payload.weather.snr + '/illuminance/state',
            device_class: 'illuminance',
            unique_id: msg.payload.weather.snr + '_illuminance',
            unit_of_measurement: 'lm',
          }
          client.publish('homeassistant/sensor/' + msg.payload.weather.snr + '/illuminance/config', JSON.stringify(illuminance_payload))

          var temperature_payload = {
            ...payload,
            state_topic: 'warema/' + msg.payload.weather.snr + '/temperature/state',
            device_class: 'temperature',
            unique_id: msg.payload.weather.snr + '_temperature',
            unit_of_measurement: 'C',
          }
          client.publish('homeassistant/sensor/' + msg.payload.weather.snr + '/temperature/config', JSON.stringify(temperature_payload))

          client.publish(availability_topic, 'online', {retain: true})
          registered_shades += msg.payload.weather.snr
        }
        break
      case 'wms-vb-blind-position-update':
        client.publish('warema/' + msg.payload.snr + '/position', msg.payload.position.toString())
        break
      case 'wms-vb-scanned-devices':
        msg.payload.devices.forEach(element => registerDevice(element))
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
  // console.log(topic + ':' + message.toString())
  var device = parseInt(topic.split('/')[1])
  var command = topic.split('/')[2]
  switch (command) {
    case 'set':
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
      }
      break
    case 'set_position':
      stickUsb.vnBlindSetPosition(device, parseInt(message))
      break
    //default:
    //  console.log('Unrecognised command from HA')
  }
})

var stickUsb = new warema(settingsPar.wmsSerialPort,
  settingsPar.wmsChannel,
  settingsPar.wmsPanid,
  settingsPar.wmsKey,
  {},
  callback
);

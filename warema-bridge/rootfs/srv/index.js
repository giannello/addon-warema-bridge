const warema = require('./warema-wms-venetian-blinds');
var mqtt = require('mqtt')

process.on('SIGINT', function () {
    process.exit(0);
});

const mqttServer = process.env.MQTT_SERVER || 'mqtt://localhost'
const ignoredDevices = process.env.IGNORED_DEVICES ? process.env.IGNORED_DEVICES.split(',') : [];
const forceDevices = process.env.FORCE_DEVICES ? process.env.FORCE_DEVICES.split(',') : [];
const pollingInterval = process.env.POLLING_INTERVAL || 30000;
const movingInterval = process.env.MOVING_INTERVAL || 1000;
const debug = process.env.DEBUG || false;

const settingsPar = {
    wmsChannel: process.env.WMS_CHANNEL || 17,
    wmsKey: process.env.WMS_KEY || '00112233445566778899AABBCCDDEEFF',
    wmsPanid: process.env.WMS_PAN_ID || 'FFFF',
    wmsSerialPort: process.env.WMS_SERIAL_PORT || '/dev/ttyUSB0',
};

var devices = [];

function registerDevice(element) {
    console.log('Registering ' + element.snr)
    var topic = 'homeassistant/cover/' + element.snr + '/' + element.snr + '/config'
    var availability_topic = 'warema/' + element.snr + '/availability'

    var base_payload = {
        name: element.snr,
        availability: [
            {topic: 'warema/bridge/state'},
            {topic: availability_topic}
        ],
        unique_id: element.snr
    }

    var base_device = {
        identifiers: element.snr,
        manufacturer: "Warema",
        name: element.snr
    }

    var model
    var payload
    switch (parseInt(element.type)) {
        case 6:
            model = 'Weather station eco'
            payload = {
                ...base_payload,
                device: {
                    ...base_device,
                    model: model
                }
            }

            var illuminance_payload = {
                ...payload,
                state_topic: 'warema/' + element.snr + '/illuminance/state',
                device_class: 'illuminance',
                unique_id: element.snr + '_illuminance',
                unit_of_measurement: 'lm',
            }
            client.publish('homeassistant/sensor/' + element.snr + '/illuminance/config', JSON.stringify(illuminance_payload))

            //No temp on weather station eco
            var temperature_payload = {
                ...payload,
                state_topic: 'warema/' + element.snr + '/temperature/state',
                device_class: 'temperature',
                unique_id: element.snr + '_temperature',
                unit_of_measurement: 'C',
            }
            client.publish('homeassistant/sensor/' + element.snr + '/temperature/config', JSON.stringify(temperature_payload))

            var wind_payload = {
                ...payload,
                state_topic: 'warema/' + element.snr + '/wind/state',
                device_class: 'wind_speed',
                unique_id: element.snr + '_wind',
                unit_of_measurement: 'm/s',
            }
            client.publish('homeassistant/sensor/' + element.snr + '/wind/config', JSON.stringify(wind_payload))

            //No rain on weather station eco
            var rain_payload = {
                ...payload,
                state_topic: 'warema/' + element.snr + '/rain/state',
                device_class: 'moisture',
                unique_id: element.snr + '_rain'
            }
            client.publish('homeassistant/binary_sensor/' + element.snr + '/rain/config', JSON.stringify(rain_payload))

            client.publish(availability_topic, 'online', {retain: true})

            // No need to add to stick, updates are broadcasted
            return;
        case 7:
            // WMS Remote pro
            return;
        case 9:
            // WMS WebControl Pro - while part of the network, we have no business to do with it.
            return;
        case 20:
            model = 'Plug receiver'
            payload = {
                ...base_payload,
                device: {
                    ...base_device,
                    model: model
                },
                position_open: 0,
                position_closed: 100,
                command_topic: 'warema/' + element.snr + '/set',
                state_topic: 'warema/' + element.snr + '/state',
                position_topic: 'warema/' + element.snr + '/position',
                tilt_status_topic: 'warema/' + element.snr + '/tilt',
                set_position_topic: 'warema/' + element.snr + '/set_position',
                tilt_command_topic: 'warema/' + element.snr + '/set_tilt',
                tilt_closed_value: -100,
                tilt_opened_value: 100,
                tilt_min: -100,
                tilt_max: 100,
            }
            break;
        case 21:
            model = 'Actuator UP'
            payload = {
                ...base_payload,
                device: {
                    ...base_device,
                    model: model
                },
                position_open: 0,
                position_closed: 100,
                command_topic: 'warema/' + element.snr + '/set',
                position_topic: 'warema/' + element.snr + '/position',
                tilt_status_topic: 'warema/' + element.snr + '/tilt',
                set_position_topic: 'warema/' + element.snr + '/set_position',
                tilt_command_topic: 'warema/' + element.snr + '/set_tilt',
                tilt_closed_value: -100,
                tilt_opened_value: 100,
                tilt_min: -100,
                tilt_max: 100,
            }

            break;
        case 25:
            model = 'Vertical awning'
            payload = {
                ...base_payload,
                device: {
                    ...base_device,
                    model: model
                },
                position_open: 0,
                position_closed: 100,
                command_topic: 'warema/' + element.snr + '/set',
                position_topic: 'warema/' + element.snr + '/position',
                set_position_topic: 'warema/' + element.snr + '/set_position',
            }

            break;
        default:
            console.log('Unrecognized device type: ' + element.type)
            model = 'Unknown model ' + element.type
            return
    }

    if (ignoredDevices.includes(element.snr.toString())) {
        console.log('Ignoring and removing device ' + element.snr + ' (type ' + element.type + ')')
    } else {
        console.log('Adding device ' + element.snr + ' (type ' + element.type + ')')

        stickUsb.vnBlindAdd(parseInt(element.snr), element.snr.toString());

        devices[element.snr] = {};

        client.publish(availability_topic, 'online', {retain: true})
        client.publish(topic, JSON.stringify(payload))
    }
}

function callback(err, msg) {
    if (err) {
        console.log('ERROR: ' + err);
    }
    if (msg) {
        switch (msg.topic) {
            case 'wms-vb-init-completion':
                console.log('Warema init completed')
                client.publish('warema/bridge/state', 'online', {retain: true})

                stickUsb.setPosUpdInterval(pollingInterval);
                stickUsb.setWatchMovingBlindsInterval(movingInterval);

                console.log('Scanning...')

                stickUsb.scanDevices({autoAssignBlinds: false});
                break;
            case 'wms-vb-scanned-devices':
                console.log('Scanned devices:\n' + JSON.stringify(msg.payload, null, 2));
                if (forceDevices && forceDevices.length) {
                    forceDevices.forEach(deviceString => {
                        var [snr, type] = deviceString.split(':');

                        registerDevice({snr: snr, type: type || 25})
                    })
                } else {
                    msg.payload.devices.forEach(element => registerDevice(element))
                }
                console.log('Registered devices:\n' + JSON.stringify(stickUsb.vnBlindsList(), null, 2))
                break;
            case 'wms-vb-rcv-weather-broadcast':
                if (debug) console.log('Weather broadcast:\n' + JSON.stringify(msg.payload, null, 2))

                if (!devices[msg.payload.weather.snr]) {
                    registerDevice({snr: msg.payload.weather.snr, type: 6});
                }

                client.publish('warema/' + msg.payload.weather.snr + '/illuminance/state', msg.payload.weather.lumen.toString())
                client.publish('warema/' + msg.payload.weather.snr + '/temperature/state', msg.payload.weather.temp.toString())
                client.publish('warema/' + msg.payload.weather.snr + '/wind/state', msg.payload.weather.wind.toString())
                client.publish('warema/' + msg.payload.weather.snr + '/rain/state', msg.payload.weather.rain ? 'ON' : 'OFF')

                break;
            case 'wms-vb-blind-position-update':
                if (debug) console.log('Position update: \n' + JSON.stringify(msg.payload, null, 2))

                if(msg.payload.position) {
                    devices[msg.payload.snr].position = msg.payload.position;
                    client.publish('warema/' + msg.payload.snr + '/position', msg.payload.position.toString())

                    if (msg.payload.moving === false) {
                        if (msg.payload.position == 0)
                            client.publish('warema/' + msg.payload.snr + '/state', 'open');
                        else if (msg.payload.position == 100)
                            client.publish('warema/' + msg.payload.snr + '/state', 'closed');
                        else
                            client.publish('warema/' + msg.payload.snr + '/state', 'stopped');
                    }
                }
                if(msg.payload.tilt){
                    devices[msg.payload.snr].tilt = msg.payload.tilt;
                    client.publish('warema/' + msg.payload.snr + '/tilt', msg.payload.angle.toString())
                }
                break;
            default:
                console.log('UNKNOWN MESSAGE: ' + JSON.stringify(msg, null, 2));
        }
    }
}

var client = mqtt.connect(mqttServer,
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

client.on('connect', function () {
    console.log('Connected to MQTT')

    client.subscribe([
        'warema/+/set',
        'warema/+/set_position',
        'warema/+/set_tilt',
        'homeassistant/status'
    ]);
})

client.on('error', function (error) {
    console.log('MQTT Error: ' + error.toString())
})

client.on('message', function (topic, message) {
    let [scope, device, command] = topic.split('/');
    message = message.toString();

    if (debug) {
        console.log('Received message on topic')
        console.log('scope: ' + scope + ', device: ' + device + ', command: ' + command)
        console.log('message: ' + message)
    }

    if (scope === 'homeassistant' && command === 'status') {
        if (message === 'online') {
            if (debug) console.log('Home Assistant is online');
        }
        return;
    }

    //scope === 'warema'
    switch (command) {
        case 'set':
            switch (message) {
                case 'CLOSE':
                    if (debug) console.log('Closing ' + device);
                    stickUsb.vnBlindSetPosition(device, 100)
                    client.publish('warema/' + device + '/state', 'closing');
                    break;
                case 'OPEN':
                    if (debug) console.log('Opening ' + device);
                    stickUsb.vnBlindSetPosition(device, 0)
                    client.publish('warema/' + device + '/state', 'opening');
                    break;
                case 'STOP':
                    if (debug) console.log('Stopping ' + device);
                    stickUsb.vnBlindStop(device)
                    client.publish('warema/' +device + '/state', 'stopped');
                    break;
            }
            break;
        case 'set_position':
            if (debug) console.log('Setting ' + device + ' to ' + message + '%, angle ' + devices[device].angle);
            stickUsb.vnBlindSetPosition(device, parseInt(message), parseInt(devices[device]['angle']))
            break;
        case 'set_tilt':
            if (debug) console.log('Setting ' + device + ' to ' + message + '°, position ' + devices[device].position);
            stickUsb.vnBlindSetPosition(device, parseInt(devices[device]['position']), parseInt(message))
            break;
        default:
            console.log('Unrecognised command from HA')
    }
});

var stickUsb = new warema(settingsPar.wmsSerialPort,
    settingsPar.wmsChannel,
    settingsPar.wmsPanid,
    settingsPar.wmsKey,
    {},
    callback
);

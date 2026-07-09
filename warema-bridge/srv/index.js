const warema = require('./warema-wms-venetian-blinds');
const log = require('./logger');
const mqtt = require('mqtt');

process.on('SIGINT', function () {
    process.exit(0);
});

const mqttServer = process.env.MQTT_SERVER || 'mqtt://localhost'
const ignoredDevices = process.env.IGNORED_DEVICES ? process.env.IGNORED_DEVICES.split(',') : [];
const forceDevices = process.env.FORCE_DEVICES ? process.env.FORCE_DEVICES.split(',') : [];
const pollingInterval = process.env.POLLING_INTERVAL || 30000;
const movingInterval = process.env.MOVING_INTERVAL || 1000;

const settingsPar = {
    wmsChannel: process.env.WMS_CHANNEL || 17,
    wmsKey: process.env.WMS_KEY || '00112233445566778899AABBCCDDEEFF',
    wmsPanid: process.env.WMS_PAN_ID || 'FFFF',
    wmsSerialPort: process.env.WMS_SERIAL_PORT || '/dev/ttyUSB0',
};

const devices = [];

function registerDevice(element) {
    log.info('Registering ' + element.snr)
    var topic = 'homeassistant/cover/' + element.snr + '/' + element.snr + '/config'
    var availability_topic = 'warema/' + element.snr + '/availability'

    var base_payload = {
        availability: [
            {topic: 'warema/bridge/state'},
            {topic: availability_topic}
        ],
        unique_id: element.snr,
        name: null
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

            const illuminance_payload = {
                ...payload,
                state_topic: 'warema/' + element.snr + '/illuminance/state',
                device_class: 'illuminance',
                unique_id: element.snr + '_illuminance',
                object_id: element.snr + '_illuminance',
                unit_of_measurement: 'lx',
            };
            client.publish('homeassistant/sensor/' + element.snr + '/illuminance/config', JSON.stringify(illuminance_payload), {retain: true})

            //No temp on weather station eco
            const temperature_payload = {
                ...payload,
                state_topic: 'warema/' + element.snr + '/temperature/state',
                device_class: 'temperature',
                unique_id: element.snr + '_temperature',
                object_id: element.snr + '_temperature',
                unit_of_measurement: '°C',
            }
            client.publish('homeassistant/sensor/' + element.snr + '/temperature/config', JSON.stringify(temperature_payload), {retain: true})

            const wind_payload = {
                ...payload,
                state_topic: 'warema/' + element.snr + '/wind/state',
                device_class: 'wind_speed',
                unique_id: element.snr + '_wind',
                object_id: element.snr + '_wind',
                unit_of_measurement: 'm/s',
            }
            client.publish('homeassistant/sensor/' + element.snr + '/wind/config', JSON.stringify(wind_payload), {retain: true})

            //No rain on weather station eco
            const rain_payload = {
                ...payload,
                state_topic: 'warema/' + element.snr + '/rain/state',
                device_class: 'moisture',
                unique_id: element.snr + '_rain',
                object_id: element.snr + '_rain',
            }
            client.publish('homeassistant/binary_sensor/' + element.snr + '/rain/config', JSON.stringify(rain_payload), {retain: true})

            client.publish(availability_topic, 'online', {retain: true})

            devices[element.snr] = {};
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
        case 24:
            // TODO: Smart socket
            model = 'Smart socket';
            payload = {
                ...base_payload,
                device: {
                    ...base_device,
                    model: model
                },
                state_topic: 'warema/' + element.snr + '/state',
                command_topic: 'warema/' + element.snr + '/set',
            }

            break;
        case 25:
            model = 'Vertical awning';
            payload = {
                ...base_payload,
                device: {
                    ...base_device,
                    model: model
                },
                position_open: 0,
                position_closed: 100,
                state_topic: 'warema/' + element.snr + '/state',
                command_topic: 'warema/' + element.snr + '/set',
                position_topic: 'warema/' + element.snr + '/position',
                set_position_topic: 'warema/' + element.snr + '/set_position',
            }

            break;
        default:
            log.info('Unrecognized device type: ' + element.type)
            model = 'Unknown model ' + element.type
            return
    }

    if (ignoredDevices.includes(element.snr.toString())) {
        log.info('Ignoring and removing device ' + element.snr + ' (type ' + element.type + ')')
    } else {
        log.info('Adding device ' + element.snr + ' (type ' + element.type + ')')

        stickUsb.vnBlindAdd(parseInt(element.snr), element.snr.toString());

        devices[element.snr] = {};

        client.publish(availability_topic, 'online', {retain: true})
        client.publish(topic, JSON.stringify(payload), {retain: true})
    }
}

function callback(err, msg) {
    if (err) {
        log.error(err);
    }
    if (msg) {
        switch (msg.topic) {
            case 'wms-vb-init-completion':
                log.info('Warema init completed')

                stickUsb.setPosUpdInterval(pollingInterval);
                stickUsb.setWatchMovingBlindsInterval(movingInterval);

                log.info('Scanning...')

                stickUsb.scanDevices({autoAssignBlinds: false});
                break;
            case 'wms-vb-scanned-devices':
                log.info('Scanned devices:\n' + JSON.stringify(msg.payload, null, 2));
                if (forceDevices && forceDevices.length) {
                    forceDevices.forEach(deviceString => {
                        const [snr, type] = deviceString.split(':');

                        registerDevice({snr: snr, type: type || 25})
                    })
                } else {
                    msg.payload.devices.forEach(element => registerDevice(element))
                }
                log.info('Registered devices:\n' + JSON.stringify(stickUsb.vnBlindsList(), null, 2))
                break;
            case 'wms-vb-rcv-weather-broadcast':
                log.silly('Weather broadcast:\n' + JSON.stringify(msg.payload, null, 2))

                if (!devices[msg.payload.weather.snr]) {
                    registerDevice({snr: msg.payload.weather.snr, type: 6});
                }

                client.publish('warema/' + msg.payload.weather.snr + '/illuminance/state', msg.payload.weather.lumen.toString(), {retain: true})
                client.publish('warema/' + msg.payload.weather.snr + '/temperature/state', msg.payload.weather.temp.toString(), {retain: true})
                client.publish('warema/' + msg.payload.weather.snr + '/wind/state', msg.payload.weather.wind.toString(), {retain: true})
                client.publish('warema/' + msg.payload.weather.snr + '/rain/state', msg.payload.weather.rain ? 'ON' : 'OFF', {retain: true})

                break;
            case 'wms-vb-blind-position-update':
                log.debug('Position update: \n' + JSON.stringify(msg.payload, null, 2))

                if (typeof msg.payload.position !== "undefined") {
                    devices[msg.payload.snr].position = msg.payload.position;
                    client.publish('warema/' + msg.payload.snr + '/position', '' + msg.payload.position, {retain: true})

                    if (msg.payload.moving === false) {
                        if (msg.payload.position === 0)
                            client.publish('warema/' + msg.payload.snr + '/state', 'open', {retain: true});
                        else if (msg.payload.position === 100)
                            client.publish('warema/' + msg.payload.snr + '/state', 'closed', {retain: true});
                        else
                            client.publish('warema/' + msg.payload.snr + '/state', 'stopped', {retain: true});
                    }
                }
                if (typeof msg.payload.tilt !== "undefined") {
                    devices[msg.payload.snr].tilt = msg.payload.tilt;
                    client.publish('warema/' + msg.payload.snr + '/tilt', '' + msg.payload.angle, {retain: true})
                }
                break;
            default:
                log.info('UNKNOWN MESSAGE: ' + JSON.stringify(msg, null, 2));
        }

        client.publish('warema/bridge/state', 'online', {retain: true})
    }
}

const stickUsb = new warema(settingsPar.wmsSerialPort,
    settingsPar.wmsChannel,
    settingsPar.wmsPanid,
    settingsPar.wmsKey,
    {},
    callback
);

//Do not attempt connecting to MQTT if trying to discover network parameters
if (settingsPar.wmsPanid === 'FFFF') return;

const client = mqtt.connect(mqttServer,
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
    log.info('Connected to MQTT')

    client.subscribe([
        'warema/+/set',
        'warema/+/set_position',
        'warema/+/set_tilt',
        'homeassistant/status'
    ]);
})

client.on('error', function (error) {
    log.error('MQTT Error: ' + error.toString())
})

client.on('message', function (topic, message) {
    let [scope, device, command] = topic.split('/');
    message = message.toString();

    log.debug('Received message on topic')
    log.debug('scope: ' + scope + ', device: ' + device + ', command: ' + command)
    log.debug('message: ' + message)

    if (scope === 'homeassistant' && command === 'status') {
        if (message === 'online') {
            log.info('Home Assistant is online');
        }
        return;
    }

    //scope === 'warema'
    switch (command) {
        case 'set':
            switch (message) {
                case 'ON':
                case 'OFF':
                    //TODO: use stick to turn on/off
                    break;
                case 'CLOSE':
                    log.debug('Closing ' + device);
                    stickUsb.vnBlindSetPosition(device, 100)
                    client.publish('warema/' + device + '/state', 'closing');
                    break;
                case 'OPEN':
                    log.debug('Opening ' + device);
                    stickUsb.vnBlindSetPosition(device, 0);
                    client.publish('warema/' + device + '/state', 'opening');
                    break;
                case 'STOP':
                    log.debug('Stopping ' + device);
                    stickUsb.vnBlindStop(device);
                    break;
            }
            break;
        case 'set_position':
            log.debug('Setting ' + device + ' to ' + message + '%, angle ' + devices[device].angle);
            stickUsb.vnBlindSetPosition(device, parseInt(message), parseInt(devices[device]['angle']))
            break;
        case 'set_tilt':
            log.debug('Setting ' + device + ' to ' + message + '°, position ' + devices[device].position);
            stickUsb.vnBlindSetPosition(device, parseInt(devices[device]['position']), parseInt(message))
            break;
        default:
            log.info('Unrecognised command from HA')
    }
});

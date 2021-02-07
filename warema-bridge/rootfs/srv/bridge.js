const WmsVbWsApi = require("warema-wms-venetian-blinds-ws-api");

const settingsPar = {
    wmsChannel   : process.env.WMS_CHANNEL     || 17,
    wmsKey       : process.env.WMS_KEY         || '00112233445566778899AABBCCDDEEFF',
    wmsPanid     : process.env.WMS_PAN_ID      || 'FFFF',
    wmsSerialPort: process.env.WMS_SERIAL_PORT || '/dev/ttyUSB0',
    wsPort       : process.env.WMS_WS_PORT     || 8080,
    wsPath       : process.env.WMS_WS_PATH     || '/'
  };

var wsApi = new WmsVbWsApi(settingsPar);

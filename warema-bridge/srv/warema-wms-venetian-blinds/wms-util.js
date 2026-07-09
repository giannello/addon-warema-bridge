const log = require('../logger.js')
const wmsAngle = 75;

var gMsgId = 0;

exports.snrNumToHex = snrNumToHex;
exports.snrHexToNum = snrHexToNum;
exports.wmsMsgNew = wmsMsgNew;
exports.encodeCmd = encodeCmd;
exports.decodeStickCmd = decodeStickCmd;

//trim wms string
function wmsTrim(data) {
    posEndMarker = data.lastIndexOf('}');
    if (posEndMarker >= 1) {
        data = data.substring(0, posEndMarker);
    }

    if (data.startsWith("{")) {
        return data.trim().substr(1);
    } else {
        return data.trim();
    }
}

//-----------------------------------------------------------------------------------------------------------------------------
function snrNumToHex(snr) {
    if ((typeof snr) === "number") {
        var hex = snr.toString(16).toUpperCase();

        // Fuehrede 0
        hex = Array(6 + 1 - hex.length).join('0') + hex;
        // von 0A2469 zu 69240A
        hex = hex.substr(4, 2) + hex.substr(2, 2) + hex.substr(0, 2);
    } else {
        hex = snr;
    }

    return hex;
}

//-----------------------------------------------------------------------------------------------------------------------------
function snrHexToNum(hex) {
    if ((typeof hex) === "string") {
        // leading 0
        hex = Array(6 + 1 - hex.length).join('0') + hex;
        // from 69240A to 0A2469
        hex = hex.substr(4, 2) + hex.substr(2, 2) + hex.substr(0, 2);

        num = parseInt(hex, 16);
    } else {
        num = hex;
    }

    return num;
}

//--------------------------------------------------------------------------------------------------
function wmsMsgNew(cmd, snr, params) {

    log.silly("wmsUtil: wmsMsgNew " + cmd + " " + snr + " params: " + JSON.stringify(params));
    this.id = undefined;
    this.msgType = cmd;
    this.snr = snrNumToHex(snr);
    this.snrNum = snrHexToNum(snr);

    if (params.stickCmd) {
        // Message received from stick
        this.stickCmd = params.stickCmd;
        params.stickCmd = undefined;
    } else {
        // Prepare Message to be sent to Stick
        gMsgId = (gMsgId + 1) % 1000;
        this.id = gMsgId;
        this.stickCmd = encodeCmd(cmd, snr, params);
        this.queuedTs = undefined;
        this.comTs = undefined,
            this.timeout = 2000;
        this.delayAfter = 0;
        this.retry = -1; // -1: no retry
        this.onEnd = undefined;

        switch (cmd) {
            case "blindGetPos"   :
                this.timeout = 500;
                this.delayAfter = 100;
                this.retry = 5;
                break;
            case "blindMoveToPos":
                this.timeout = 500;
                this.delayAfter = 300;
                this.retry = 3;
                break;
            case "blindStopMove" :
                this.timeout = 200;
                this.delayAfter = 5;
                this.retry = 3;
                break;
            case "waveRequest"   :
                this.timeout = 500;
                this.delayAfter = 300;
                break;
            case "scanRequest"   :
                this.timeout = 750;
                break;
        }
    }
    this.params = params;
}

//--------------------------------------------------------------------------------------------------
function encodeCmd(cmd, snr, params) {
    ret = {
        cmd: "",
        expect: {msgType: "", snr: undefined}
    };

    var snrHex = snrNumToHex(snr);

    log.silly("wmsUtil: encodeCmd " + cmd + " " + snr + " params: " + JSON.stringify(params));

    switch (cmd) {
        case "blindGetPos":
            ret.expect.msgType = "position";
            ret.expect.snr = snrHex;
            ret.cmd = '{R06' + snrHex + '8010' + '01000005}';
            break;
        case "blindMoveToPos":
            if (params.pos === undefined) {
                log.error("wmsUtil: blindMoveToPos: pos undefined. Assuming 0.");
                params.pos = 0;
            }
            if (params.ang === undefined) {
                log.error("wmsUtil: blindMoveToPos: ang undefined. Assuming 0.");
                params.ang = 0;
            }
            ret.expect.msgType = "blindMoveToPosResponse";
            ret.expect.snr = snrHex;
            ret.cmd = '{R06' + snrHex + '7070' + '03' + wmsPosPercentToHex(params.pos) + wmsAnglePercentToHex(params.ang) + 'FFFF}'; //no idea how valance works
            break;
        case "blindStopMove":
            ret.cmd = '{R06' + snrHex + "7070" + "01" + "FF" + "FF" + "FFFF00}";
            ret.expect.msgType = "blindMoveToPosResponse";
            ret.expect.snr = snrHex;
            break;
        case "stickGetName":
            ret.cmd = '{G}';
            ret.expect.msgType = "stickName";
            ret.expect.snr = undefined;
            break;
        case "stickGetVersion":
            ret.cmd = '{V}';
            ret.expect.msgType = "stickVersion";
            ret.expect.snr = undefined;
            break;
        case "stickSetKey":
            ret.cmd = '{K401' + params.key + '}';
            ret.expect.msgType = "ack";
            ret.expect.snr = undefined;
            break;
        case "stickSwitchChannel":
            ret.cmd = '{M%' + params.channel + params.panId + '}';
            ret.expect.msgType = "ack";
            ret.expect.snr = undefined;
            break;
        case "scanRequest":
            ret.cmd = '{R04FFFFFF7020' + params.panId + '02}';
            ret.expect.msgType = "";
            ret.expect.snr = undefined;
            break;
        case "scanResponse":
            ret.cmd = '{R01' + snrHex + '7021' + params.panId + '02}';  //fixed to deviceType 02 for now
            ret.expect.msgType = "ackMsg";
            ret.expect.snr = snrHex;
            break;
        case "ackMsg":
            ret.cmd = '{R21' + snrHex + '50AC}';
            ret.expect.msgType = "ack";
            ret.expect.snr = undefined;
            break;
        case "ack":
            ret.cmd = '{a}';
            ret.expect.msgType = "";
            ret.expect.snr = undefined;
            break;
        case "blindBeckonRequest":
        case "waveRequest":
            ret.cmd = '{R06' + snrHex + '7050}';
            ret.expect.msgType = "ackMsg";
            ret.expect.snr = snrHex;
            break;
        default:
            log.error('wmsUtil: Cannot encode unknown CMD "' + cmd + '".');
    }

    log.silly('wmsUtil: Encoded ' + JSON.stringify(ret) + ' .');
    return ret;
}

//--------------------------------------------------------------------------------------------------
function decodeStickCmd(rcv) {
    log.silly("wmsUtil: decodeStickCmd: " + rcv);

    params = {stickCmd: rcv};
    snr = "000000";
    msgType = "unknown";

    // sortierung nach Häufigkeit
    if (rcv.startsWith('{a}')) {
        msgType = "ack";
    } else if (rcv.startsWith('{f}')) {
        msgType = "fwd";
    } else if (rcv.startsWith('{r')) {
        // {rAAAAAA801101000003PPWWV1V200}
        // 0123456789012345678901234567890123456789
        //           111111111122222222223333333333
        // AAAAAA = SNR (Seriennummer) vom abgefragten Zwischenstecker in HEX.
        // 8011 = Nachrichten Typ hier Statusantwort
        // PP = Position in % * 2 (HEX) muss daher durch 2 geteilt werden
        // WW = Winkel +127 in HEX. 127 entspricht daher 0°.
        // V1 = Position Volant 1. FF entspricht nicht vorhanden.
        // V2 = Position Volant 2. FF entspricht nicht vorhanden.

        snr = rcv.substr(2, 6);

        rcvTyp = rcv.substr(8, 4);
        payload = rcv.substr(12);
        switch (rcvTyp) {
            case '8011': // parameterGetResponse
                parameterType = payload.substr(0, 8);
                switch (parameterType) {
                    case '01000003': //position
                    case '01000005': //position
                        msgType = "position";
                        params.position = wmsPosHexToPercent(payload.substr(8, 2));
                        params.angle = wmsAngleHexToPercent(payload.substr(10, 2));
                        params.valance_1 = payload.substr(12, 2);
                        params.valance_2 = payload.substr(14, 2);
                        params.moving = !(payload.substr(16, 2) === '00');
                        break;
                    case '0C000006': //auto modes & limits
                        params.type = 'autoSettings';
                        params.wind = parseInt(payload.substr(12, 2), 16);
                        params.rain = parseInt(payload.substr(22, 2), 16);
                        params.sun = parseInt(payload.substr(24, 2), 16);
                        params.dusk = parseInt(payload.substr(26, 2), 16);
                        params.op = parseInt(payload.substr(28, 2), 16);
                        break;
                    case '26000046':
                        params.type = 'clock';
                        params.unknown = payload.substr(20);
                        break;
                }
                break;
            case '7071':
                msgType = 'blindMoveToPosResponse';
                params.unknown1 = payload.substr(0, 10);
                params.prevPosition = wmsPosHexToPercent(payload.substr(10, 2));
                params.prevAngle = wmsAngleHexToPercent(payload.substr(12, 2));
                params.prevValance_1 = payload.substr(14, 2);
                params.prevValance_2 = payload.substr(16, 2);
                params.unknown2 = payload.substr(18, 8);
                break;
            case '7080':
                msgType = 'weatherBroadcast';
                params.unknown_1 = payload.substr(0, 2);
                params.wind = parseInt(payload.substr(2, 2), 16);
                params.lumen = payload.substr(4, 2) === '00' ? parseInt(payload.substr(12, 2), 16) * 2 : parseInt(payload.substr(4, 2), 16) * parseInt(payload.substr(12, 2), 16) * 2;
                params.unknown_2 = payload.substr(6, 6);
                params.unknown_3 = payload.substr(14, 2);
                params.rain = payload.substr(16, 2) === 'C8';
                params.temp = parseInt(payload.substr(18, 2), 16) / 2 - 35;
                params.unknown_4 = payload.substr(20);
                break;
            case '8020':
                parameterType = payload.substr(0, 8);
                switch (parameterType) {
                    case '0B080009': //clock
                        msgType = 'clock';
                        params.year = parseInt(payload.substr(8, 2), 16);
                        params.month = parseInt(payload.substr(10, 2), 16);
                        params.day = parseInt(payload.substr(12, 2), 16);
                        params.hour = parseInt(payload.substr(14, 2), 16);
                        params.minute = parseInt(payload.substr(16, 2), 16);
                        params.second = parseInt(payload.substr(18, 2), 16);
                        params.day_of_week = parseInt(payload.substr(20, 2), 16);
                        params.unknown = payload.substr(22);
                        break;
                        break;
                }
                break;
            case '5018':
                msgType = 'joinNetworkRequest';
                params.panId = payload.substr(0, 4);
                params.networkKey = payload.substr(4, 32).match(/../g).reverse().join("");
                params.unknown = payload.substr(36, 2);
                params.channel = parseInt(payload.substr(38, 2), 16);
                break;
            case '5060':
                msgType = 'switchChannelRequest';
                params.panId = payload.substr(0, 4);
                params.deviceType = payload.substr(4, 2);
                params.channel = parseInt(payload.substr(6, 2), 16);
                break;
            case '50AC':
                msgType = 'ackMsg';
                params.unknown = payload.substr(0, 4);
                break;
            case '7020':
                msgType = 'scanRequest';
                params.panId = payload.substr(0, 4);
                params.deviceType = payload.substr(4, 2);
                break;
            case '7021':
                msgType = 'scanResponse';
                params.deviceType = payload.substr(4, 2); //63: Wetterstation, 06: Webcontrol, 02: Stick/software, 20: Zwischenstecker, 21: Aktor UP
                params.deviceTypeStr = "<unknown>";
                params.panId = payload.substr(0, 4);
                params.unknown = payload.substr(6); //optional
                switch (params.deviceType) {
                    case '02':
                        params.deviceTypeStr = 'Stick/software   ';
                        break;
                    case '06':
                        params.deviceTypeStr = 'Weather station  ';
                        break;
                    case '07':
                        params.deviceTypeStr = 'Remote control(+)';
                        break;
                    case '09':
                        params.deviceTypeStr = 'Web control pro  ';
                        break;
                    case '20':
                        params.deviceTypeStr = 'Actuator UP      ';
                        break;
                    case '21':
                        params.deviceTypeStr = 'Plug receiver    ';
                        break;
                    case '24':
                        params.deviceTypeStr = 'Smart socket     ';
                        break;
                    case '25':
                        params.deviceTypeStr = 'Radio motor      ';
                        break;
                    case '63':
                        params.deviceTypeStr = 'Web control      ';
                        break;
                }
                break;
            case '7050':
                msgType = 'waveRequest';
                break;
            case '7070':
                msgType = 'blindMoveToPos';
                params.unknown = payload.substr(0, 2);
                params.position = wmsPosHexToPercent(payload.substr(2, 2));
                params.angle = wmsAngleHexToPercent(payload.substr(4, 2));
                params.valance_1 = payload.substr(6, 2);
                params.valance_2 = payload.substr(8, 2);
                break;
            case '8010':
                msgType = 'parameterGetRequest';
                params.parameter = payload.substr(0) //01000005: position, 26000046: clock timer settings, 0C000006: auto modes & limits
                break;
        }
    } else if (rcv.startsWith('{g')) {
        msgType = "stickName";
        params.stickName = wmsTrim(rcv.substring(2));
    } else if (rcv.startsWith('{v')) {
        msgType = "stickVersion";
        params.stickName = wmsTrim(rcv.substring(2));
    }

    ret = new wmsMsgNew(msgType, snr, params);
    log.silly('wmsUtil: Decoded ' + JSON.stringify(ret) + '.');
    return ret;
}

//--------------------------------------------------------------------------------------------------
function wmsAngleHexToPercent(angHex) {
    return Math.round((parseInt(angHex, 16) - 127) / wmsAngle * 100);
}

//--------------------------------------------------------------------------------------------------
function wmsAnglePercentToHex(angPercent) {
    return ('0' + (Math.min(Math.max(Math.round(angPercent / 100 * wmsAngle), -75), 75) + 127).toString(16)).substr(-2).toUpperCase();
}

//--------------------------------------------------------------------------------------------------
function wmsPosHexToPercent(posHex) {
    return Math.round(parseInt(posHex, 16) / 2);
}

//--------------------------------------------------------------------------------------------------
function wmsPosPercentToHex(posPercent) {
    return ('0' + (Math.min(Math.max(posPercent, 0), 100) * 2).toString(16)).substr(-2).toUpperCase();
}

//--------------------------------------------------------------------------------------------------


//--------------------------------------------------------------------------------------------------
//
//--------------------------------------------------------------------------------------------------
const WmsVbStick = require('./wms-vb-stick')
const {SerialPort} = require('serialport')
const {DelimiterParser} = require('@serialport/parser-delimiter')

const DelimiterChar = '}';
var log;

//--------------------------------------------------------------------------------------------------
function getLogger() {
    return log;
}

//--------------------------------------------------------------------------------------------------
class WmsVbStickUsb extends WmsVbStick {
    constructor(portPath, channel, panid, key, optionsPar, callback) {
        super(portPath, channel, panid, key, optionsPar, callback);
        this.portPath = portPath;

        if (this.options.autoOpen) {
            this.openUsbPort(portPath, channel, panid, key, this.options);
        }
    }

    static listWmsStickSerialPorts(callback) {
        var portsList = [];
        var portsWorkList = [];
        var portsOpened = [];
        var errorMsg = "";
        var callbackPendig = true;
        var timer;

        // serialport since version 8.0.0:
        // Promise instead of callback
        SerialPort.list().then(
            ports => {
                timer = setTimeout(timeoutListWmsStickSerialPorts, 1000); // In 1 second all WMS Sticks should have answered.

                // . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
                function appendErrorMsg(msg) {
                    log.D("appendErrorMsg: " + msg);
                    if (errorMsg) {
                        errorMsg += " ";
                    }
                    errorMsg += msg;
                }

                // . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
                function timeoutListWmsStickSerialPorts() {
                    appendErrorMsg('Timeout scanning port: ' + portsWorkList.join(", ") + ".");
                    finishListWmsStickSerialPorts();
                }

                // . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
                function finishListWmsStickSerialPorts() {
                    for (var i = 0; i < portsOpened.length; i++) {
                        log.D('Closing ' + portsOpened[i].path + '.');
                        portsOpened[i].close(function (err) {
                            if (err) {
                                appendErrorMsg('Error closing port: ' + err + ".");
                            }
                        });
                    }
                    if (callbackPendig) {
                        callback(errorMsg, {topic: "wms-vb-list-serial-ports", payload: {portsList: portsList}});
                        callbackPendig = false;
                    }
                }

                // . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
                function portsWorkListFinishPort(portPath) {
                    var pos = portsWorkList.indexOf(portPath);
                    if (pos >= 0) {
                        portsWorkList.splice(pos, 1);
                        if (portsWorkList.length === 0) {
                            log.T("portsWorkList now empty.");
                            clearTimeout(timer);
                            finishListWmsStickSerialPorts();
                        }
                    }
                }

                // . End of local functions  . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .

                log.T(ports.length + " ports found:\n" + JSON.stringify(ports, null, 2));
                ports.forEach((port) => {
                    portsWorkList.push(port.path);
                });

                ports.forEach((port) => {
                    log.T("foreach " + port.path);
                    if (true || port.path.includes("USB")) {

                        var testPort = new SerialPort(port.path, {baudRate: 125000})
                        var testParser = testPort.pipe(new Delimiter({delimiter: DelimiterChar}))

                        testPort.on('open', function () {
                            log.T('Opened serial port ' + port.path + '.');
                            portsOpened.push(testPort);

                            testParser.on('data', function (data) {
                                var rcvString = data.toString('utf8') + DelimiterChar;
                                log.T(port.path + " received: " + rcvString);
                                if (rcvString.substr(0, 2) === "{v") {
                                    var version = rcvString.substr(2);
                                    var posEndMarker = version.lastIndexOf('}');
                                    if (posEndMarker >= 1) {
                                        version = version.substring(0, posEndMarker);
                                    }
                                    log.T(port.path + " version: " + version);
                                    port.wmsStickVersion = version;
                                    portsList.push(port);
                                    portsWorkListFinishPort(port.path);
                                }

                                portsWorkListFinishPort(port.path);

                            });

                            testPort.write('{V}', function (err) {
                                if (err) {
                                    appendErrorMsg('Port ' + port.path + ' error on write: ' + err.message + '.')
                                    portsWorkListFinishPort(port.path);
                                } else {
                                    log.T(port.path + ' message written');
                                }
                            })
                        });

                        testPort.on('error', function (err) {
                            portsWorkListFinishPort(port.path);
                            if (err.message.includes("125000")) {
                                // Input/output error setting custom baud rate of 125000.
                                log.T('Port ' + port.path + ' error event: ' + err.message + '.');
                            } else {
                                appendErrorMsg('Port ' + port.path + ' error event: ' + err.message + '.');
                            }
                        });
                    } else {
                        portsWorkListFinishPort(port.path);
                    }
                });
            },
            err => console.error(err)
        );
    }

    openUsbPort(portPath, channel, panid, key, options) {
        log.D(portPath + " open(" + portPath + ", " + channel + ", " + panid + ", " + key + ", " + JSON.stringify(options) + ")");

        this.port = new SerialPort({path: portPath, baudRate: 125000})

        this.parser = this.port.pipe(new DelimiterParser({delimiter: DelimiterChar}))

        var stickObj = this;
        this.port.on('open', function () {
            log.D('Opened port ' + portPath + ' and listening ...');
            stickObj.initWmsNetwork();
        })

        this.port.on('error', function (err) {
            if (!portPath) {
                portPath = portPath;
            }

            log.E(portPath + ' error: ', err.message)
            this.status = "error";
        })

        this.parser.on('data', function (data) {
            stickObj.comDataReceive(data.toString('utf8') + DelimiterChar);
        });

        this.parser.on('close', function (data) {
            log.D(portPath + ' port closed. ');
            this.status = "created";
        });
    }

    // Overwriting suber class
    comDataSendCallback(dataString) {
        // . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
        function portWriteErrHdlr(err) {
            if (err) {
                return console.log('Error on write to port: ', err.message)
            }
        }

        // . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .

        this.port.write(dataString, portWriteErrHdlr);
    }

}

//--------------------------------------------------------------------------------------------------
log = WmsVbStick.getLogger();
module.exports.getLogger = getLogger;
module.exports = WmsVbStickUsb;


# warema-wms-venetian-blinds

*warema-wms-venetian-blinds* is a node module for the Warema WMS (WAREMA Mobile System) radio control system. It
controls a Warema WMS Stick as transmitter to the Warema WMS network.

**Table of contents**

<!-- toc -->

* [Prerequisites](#prerequisites)
* [Limitations and known issues](#limitations-and-known-issues)
* [Features](#features)
    * [Supported Warema WMS device types](#supported-warema-wms-device-types)
    * [WMS network configuration](#wms-network-configuration)
    * [controlling venetian blinds](#controlling-venetian-blinds)
* [Installation](#installation)
* [Usage](#usage)
    * [Example: Common blind control](#example-common-blind-control)
    * [Example: Listing serial ports with WMS stick](#example-listing-serial-ports-with-wms-stick)
    * [Example: Getting WMS network parameters](#example-getting-wms-network-parameters)
    * [Example: Scanning devices](#example-scanning-devices)
* [API documentation](#api-documentation)
    * [Static Methods](#static-methods)
        * [WmsVbStickUsb.listWmsStickSerialPorts( callback(error,data) )](#wmsvbstickusblistwmsstickserialports-callbackerrordata)
    * [Class WmsVbStickUsb](#class-wmsvbstickusb)
        * [Constructor WmsVbStickUsb( portPath, channel, panid, key, options, callback )](#constructor-wmsvbstickusb-portpath-channel-panid-key-options-callback)
    * [Messages of the stick's callback function](#messages-of-the-sticks-callback-function)
        * [Topic "wms-vb-scanned-devices"](#topic-wms-vb-scanned-devices)
        * [Topic "wms-vb-rcv-weather-broadcast"](#topic-wms-vb-rcv-weather-broadcast)
        * [Topic "wms-vb-cmd-result-set-position"](#topic-wms-vb-cmd-result-set-position)
        * [Topic "wms-vb-cmd-result-stop"](#topic-wms-vb-cmd-result-stop)
        * [Topic "wms-vb-blind-position-update"](#topic-wms-vb-blind-position-update)
    * [Methods](#methods)
        * [wmsStick.addVnBlind(snr,name)](#wmsstickaddvnblindsnrname)
        * [wmsStick.vnBlindRemove(blindId)](#wmsstickvnblindremoveblindid)
        * [wmsStick.vnBlindGetPosition(blindId)](#wmsstickvnblindgetpositionblindid)
        * [wmsStick.setPosUpdInterval(intervalMsec)](#wmssticksetposupdintervalintervalmsec)
        * [wmsStick.setWatchMovingBlindsInterval(intervalMsec)](#wmssticksetwatchmovingblindsintervalmsec)
        * [wmsStick.setCmdConfirmationNotificationEnabled(boolean)](#wmssticksetcmdconfirmationnotificationenabledboolean)
        * [wmsStick.vnBlindSetPosition(blindId,position,angle)](#wmsstickvnblindsetpositionblindidpositionangle)
        * [wmsStick.vnBlindSlatUp(blindId)](#wmsstickvnblindslatupblindid)
        * [wmsStick.vnBlindSlatdown(blindId)](#wmsstickvnblindslatdownblindid)
        * [wmsStick.vnBlindStop(blindId)](#wmsstickvnblindstopblindid)
        * [wmsStick.vnBlindsList()](#wmsstickvnblindslist)
        * [wmsStick.scanDevices(options)](#wmsstickscandevicesoptions)
        * [wmsStick.getLastWeatherBroadcast()](#wmsstickgetlastweatherbroadcast)
        * [wmsStick.vnBlindWaveRequest(blindId)](#wmsstickvnblindwaverequestblindid)
        * [wmsStick.getStatus()](#wmsstickgetstatus)
        * [wmsStick.vnBlindGetStatus(blindId)](#wmsstickvnblindgetstatusblindid)
* [Credits](#credits)
* [Change Log](#change-log)
* [License](#license)

<!-- toc stop -->

## Prerequisites

**Note:**  
This module does not replace the initial commissioning of the Warema WMS network by a specialist company.

To use this module you need:

- A completely installed Warema WMS network
- Warema "WMS Hand-held transmitter"
- Warema "WMS Stick"
- Warema "WMS Receiver" (i.e. "WMS Plug receiver" or "WMS Actuator UP")

Optional devices (not needed for proper operation):

- "WMS Weather station eco (receiving weather data is alpha status)"
- "WMS Weather station plus (receiving weather data is alpha status)"
- "WMS WebControl"
- "WMS Central transmitter"
- "WMS studio software"

## Limitations and known issues

- Not all device types of Warema WMS are supported. See Features.
- Weather station and time broadcast are alpha state. Since I don't own the devices only mocking tests were possible.

## Features

### Supported Warema WMS device types

- 02: WMS Stick/ WMS Software
- 06: Weather station (alpha status)
- 07: Remote control (+)
- 20: Plug receiver
- 21: Actuator UP
- 25: Radio motor
- 63: Web control

### WMS network configuration

- Listing serial ports with WMS Stick ("WMS Stick" required connected to USB Port): `listWmsStickSerialPorts()`
- Getting WMS network paramters (WMS remote control ruquired, e. g. "WMS Hand-held
  transmitter"): `WmsVbStickUsb( testComName, 17/*channel*/, "FFFF"/*panid*/, "00112233445566778899AABBCCDDEEFF"/*key*/, {} /*options*/, testCallback );`
- Discover the devices contained in the WMS network: `scanDevices()`

### controlling venetian blinds

- Getting current blind position (heigth and angle of slats)
- Moving down
- Moving up
- Tilt slats down
- Tilt slats up
- Moving to a specified position (heigth and angle of slats)
- Stop moving blinds
- Wave request for blinds

## Installation

After the installation of the npm package you may have to determine the
parameters of the WMS network.

You also need to know the serial numbers of the devices you want to
control. The serial numbers are printed on labels on the Warema WMS
devices. If you do not have access to the printed serial
numbers, you can scan the devices on the network with the function
'scanDevices()'. You can identify individual blinds with the function
`vnBlindWaveRequest( serialNo )`.

See the examples below.

## Usage

### Example: Common blind control

In your installation you have to change

- `const testComName`
- Network parameters in call of constructor `WmsVbStickUsb()`

```js
//----------------------------------------------------------------------
const WmsVbStickUsb = require("warema-wms-venetian-blinds");

const testComName = "/dev/ttyUSB0";

//----------------------------------------------------------------------
function testCallback(err, msg) {
    if (err) {
        console.log("testCallback err: " + err);
    }
    if (msg) {
        console.log("testCallback msg: " + JSON.stringify(msg));

        if (msg.topic === "wms-vb-init-completion") {
            // Enable callback messages for changes of position 
            stickUsb.setPosUpdInterval(5000);

            // Open blind completely
            setTimeout(function () {
                    stickUsb.vnBlindSetPosition("Living room 1", 0, -100)
                },
                2000);

            // Set blind to half way positon with slats set horizontal
            setTimeout(function () {
                    stickUsb.vnBlindSetPosition("Living room 1", 50, 0)
                },
                10000);

            // Close blind completely
            setTimeout(function () {
                    stickUsb.vnBlindSetPosition("Living room 1", 100, 100)
                },
                20000);

            // Stop move of pecific blind
            setTimeout(function () {
                    stickUsb.vnBlindStop("Living room 1")
                },
                22000);

            // Stop move of all blinds
            setTimeout(function () {
                    stickUsb.vnBlindStop()
                },
                23000);


            // Tilt slat up
            setTimeout(function () {
                    stickUsb.vnBlindSlatUp("Living room 1")
                },
                25000);

            // Tilt slat down
            setTimeout(function () {
                    stickUsb.vnBlindSlatDown("Living room 1")
                },
                27000);

            // Get status of stick and blind
            setTimeout(function () {
                    console.log("Stick status: \n" + JSON.stringify(
                        stickUsb.getStatus(), null, 2));
                    console.log("Blind status: \n" + JSON.stringify(
                        stickUsb.vnBlindGetStatus("Living room 1"),
                        null, 2));
                    process.exit();
                },
                29000);
        }
    }
}

//----------------------------------------------------------------------
console.log("starting ...");

stickUsb = new WmsVbStickUsb(testComName,
    17/*channel*/,
    "ABCD"/*panid*/,
    "1234567890ABCDEF0123456789ABCDEF"/*key*/,
    {}, /* options */
    testCallback);

liv_1 = stickUsb.vnBlindAdd(636300, "Living room 1");
liv_2 = stickUsb.vnBlindAdd(637180, "Living room 2");
liv_3 = stickUsb.vnBlindAdd(626216, "Living room 3");
console.log("Added blinds:\n" +
    JSON.stringify(stickUsb.vnBlindsList(), null, 2));

// further demo actions are triggered in function testCallback().

console.log("finished.");
//----------------------------------------------------------------------
``` 

### Example: Listing serial ports with WMS stick

```js
//----------------------------------------------------------------------
const WmsVbStickUsb = require("warema-wms-venetian-blinds");

//----------------------------------------------------------------------
console.log("starting ...");

// Listing serial ports with WMS Stick
WmsVbStickUsb.listWmsStickSerialPorts(function (err, msg) {
    if (err) {
        console.log("listWmsStickSerialPortsCallback err: " + err);
    }
    if (msg) {
        console.log("Found " + msg.payload.portsList.length +
            " serial port(s) with WMS Stick:");
        for (var i = 0; i < msg.payload.portsList.length; i++) {
            console.log("  Port: " + msg.payload.portsList[i].path +
                ", Stick version: " +
                msg.payload.portsList[i].wmsStickVersion);
        }
        console.log("finished.");
    }
});
``` 

Example output:

```
starting ...
listWmsStickSerialPortsCallback err: Timeout scanning ports: /dev/ttyS4.
Found 1 serial port(s) with WMS Stick:
  Port: /dev/ttyUSB0, Stick version: 37605107   }
finished.
``` 

### Example: Getting WMS network parameters

In your installation you have to change

- `const testComName`

```js
//----------------------------------------------------------------------
const WmsVbStickUsb = require("warema-wms-venetian-blinds");

const testComName = "/dev/ttyUSB0";

//----------------------------------------------------------------------
function testCallback(err, msg) {
    setExitTimeout()
    if (err) {
        console.log("testCallback err: " + err);
    }
    if (msg) {
        console.log("testCallback msg: " + JSON.stringify(msg));
    }

}

//----------------------------------------------------------------------
console.log("starting ...");

// getting network parameters 
// (panid=FFFF, key=00112233445566778899AABBCCDDEEFF)
stickUsb = new WmsVbStickUsb(testComName,
    17/*channel*/,
    "FFFF"/*panid*/,
    "00112233445566778899AABBCCDDEEFF"/*key*/,
    {}, /* options */
    testCallback);

console.log("finished.");
``` 

Example Output:

```
--------------------------------------------------------------------------------
Starting getting network parameters...
- Open the battery case of the WMS Handheld transmitter.
- Select the channel using the (+) button.
  Notice: If an unassigned channel is selected, press the (+) button for 5 s.
          As soon as the LED flashes, all channels can be selected by
          pressing the (+) button again
- Press the learn button in the battery case of the WMS Handheld
  transmitter for approx. 5 s. LEDS go green; the transmission LED flashes.
  For several seconds, the WMSHand-held transmitter plus scans the operating 
  range for devices.
- Each time when scanning stops with red LED perform steps:
  1)  When you press the control button (A), you can check WHICH target device
      was just found.
  2) If you can *not* see the output
       "*** Waving and Hello!"
     on the screen after pressing (A) another device than the WMS Stick has
     been found. Press the (C) button to switch to the next receiver.
  3) If you can see the output
       "*** Waving and Hello!"
     on the screen after pressing (A) then the WMS Stick has been found. 
     Press the STOP button to assign the WMS Stick to the channel. After 
     pressing STOP the network parameters are displayed on the screen. 
- Press Ctrl-C to abort.
*** Stick scanned by SNR 123456.
*** Stick scanned by SNR 123456.
*** Stick scanned by SNR 123456.
*** *** Waving and Hello! (requested from SNR 123456)
*** *** Waving and Hello! (requested from SNR 123456)
*** WMS Network parameters successfully detected:
    Channel: 17
    PanId:   1A2B
    Key:     0123456789ABCDEF0123456789ABCDEF
- Write down and remember the network parameters.
- Briefly press the learn button on the back of WMS Handheld transmitter to
  stop the scanning process.
- Press Ctrl-C to stop program.
--------------------------------------------------------------------------------
```

### Example: Scanning devices

In your installation you have to change

- `const testComName`
- Network paramters in call of constructor `WmsVbStickUsb()`

```js
//----------------------------------------------------------------------
const WmsVbStickUsb = require("warema-wms-venetian-blinds");

const testComName = "/dev/ttyUSB0";

//----------------------------------------------------------------------
function testCallback(err, msg) {
    if (err) {
        console.log("testCallback err: " + err);
    }
    if (msg) {
        console.log("testCallback msg: " + JSON.stringify(msg));

        if (msg.topic === "wms-vb-init-completion") {
            {
                stickUsb.scanDevices({autoAssignBlinds: false});
            }
        }
        if (msg.topic === "wms-vb-scanned-devices") {
            console.log("Scanned " + msg.payload.devices.length +
                " WMS devices:");
            console.log("     SNR snrHex Type");
            for (var i = 0; i < msg.payload.devices.length; i++) {
                console.log(
                    msg.payload.devices[i].snr.toString().padStart(8, "0") +
                    " " + msg.payload.devices[i].snrHex +
                    " " + msg.payload.devices[i].type +
                    " " + msg.payload.devices[i].typeStr);
            }

            console.log("finished.");
            process.exit();
        }
    }

}

//----------------------------------------------------------------------
console.log("starting ...");

stickUsb = new WmsVbStickUsb(testComName,
    17/*channel*/,
    "01AB"/*panid*/,
    "0123456789ABCDEF01234567890ABCDE"/*key*/,
    {}, /* options */
    testCallback);

// further demo actions are triggered in function testCallback().

```

Example output:

```
starting ...
testCallback msg: {"topic":"wms-vb-init-completion","payload":{"status":"ready"}}
04 13:28:21.529 /dev/ttyUSB0 Scanned device: 219209 Type 02 Stick/software   
04 13:28:21.545 /dev/ttyUSB0 Scanned device: 2FDD08 Type 20 Plug receiver    
04 13:28:21.561 /dev/ttyUSB0 Scanned device: 87240A Type 20 Plug receiver    
04 13:28:21.588 /dev/ttyUSB0 Scanned device: 69240A Type 20 Plug receiver    
...
04 13:28:23.283 /dev/ttyUSB0 Scanned device: 288E09 Type 21 Actuator UP      
04 13:28:23.321 /dev/ttyUSB0 Scanned device: FCB809 Type 21 Actuator UP      
04 13:28:23.361 /dev/ttyUSB0 Scanned device: 87240A Type 20 Plug receiver    
04 13:28:23.361 /dev/ttyUSB0 Scanned device: 8CB509 Type 21 Actuator UP      
testCallback msg: {"topic":"wms-vb-scanned-devices","payload":{"devices":[{"snr":627233,"snrHex":"219209","type":"02","typeStr":"Stick/software   "},{"snr":580911,"snrHex":"2FDD08","type":"20","typeStr":"Plug receiver    "},{"snr":664681,"snrHex":"69240A","type":"20","typeStr":"Plug receiver    "},{"snr":664711,"snrHex":"87240A","type":"20","typeStr":"Plug receiver    "},{"snr":626216,"snrHex":"288E09","type":"21","typeStr":"Actuator UP      "},{"snr":636300,"snrHex":"8CB509","type":"21","typeStr":"Actuator UP      "},{"snr":637180,"snrHex":"FCB809","type":"21","typeStr":"Actuator UP      "}]}}
Scanned 7 WMS devices:
     SNR snrHex Type
00627233 219209 02 Stick/software   
00580911 2FDD08 20 Plug receiver    
00664681 69240A 20 Plug receiver    
00664711 87240A 20 Plug receiver    
00626216 288E09 21 Actuator UP      
00636300 8CB509 21 Actuator UP      
00637180 FCB809 21 Actuator UP      
finished.
```

## API documentation

### Static Methods

#### WmsVbStickUsb.listWmsStickSerialPorts( callback(error,data) )

Lists WMS Sticks connected to serial ports.
I.e. all serial ports responding on WMS command {V} (WMS Stick version number).

Sample output:

```json
[
    {
        "manufacturer": "FTDI",
        "serialNumber": "A5003TQL",
        "pnpId": "usb-FTDI_FT232R_USB_UART_A5003TQL-if00-port0",
        "vendorId": "0403",
        "productId": "6001",
        "path": "/dev/ttyUSB0",
        "wmsStickVersion": 37605107
    }
]
```  

The function has a timeout of 1 second. It is normal for the timeout to occur.
The function opens all serial ports and tries to determine the version of
the WMS stick. If a port can be opened and it is not a WMS stick, the
port does not respond and the search ends with the timeout.

> **Tip: Linux permissions for /dev/ttyUSBn**  
> When running warema-wms-venetian-blinds as a normal user you may be unable to access the WAREMA Stick with error
> message
> _Permission denied, cannot open /dev/ttyUSB0_ .The device is most likely attached to user group 'dialout'.
>
> `ls -l /dev/ttyUSB0`  
> `crw-rw---- 1 root dialout 188, 0 Jun 14 20:36 /dev/ttyUSB0`
>
> Just add your user to the dialout group so you have appropriate permissions on the device.
>
> `sudo usermod -a -G dialout $USER`
>
> (You may need to logout and back in or even to reboot for the new group to take effect.)

### Class WmsVbStickUsb

#### Constructor WmsVbStickUsb( portPath, channel, panid, key, options, callback )

Use this constructor to create a new WMS Stick.

**Parameters:**

- **portPath**  
  Name of serial interface, for example `/dev/ttyUSB0`
- **channel**  
  WMS network channel (see detectNetworkKeys())
- **panid**  
  WMS network panid (see detectNetworkKeys())
- **key**  
  WMS network key (see detectNetworkKeys())
- **options**  
  Up to now there are no options defined for the WMS Stick.
- **callback** function( err, msg )  
  Callback function. All events emitting data result in an call of the callback function.
  Parameter `msg` is an javascript object containing the two properties `topic` and `payload`.
  In case of error the `err` parameter contains a string describing the error.

```json
{
  "topic": "<topic indication type of event>",
  "payload": "<Data to topic>"
}
```

**Returns:**  
A object for an WMS Stick. Use this object to create venetian blinds and to control global functions.

### Messages of the stick's callback function

All events emitting data result in an call of the stick's callback function.
Parameter `msg` is an JSON object containing the two properties `topic` and `payload`.
In case of error the `err` parameter contains a string describing the error.

`msg` object:

```json
    {
  "topic": "<topic indication type of event>",
  "payload": "<Data to topic>"
}
```

#### Topic "wms-vb-scanned-devices"

A message with this topic is emitted when method `scanDevices()` is called.

```json
{
  "topic": "wms-vb-scanned-devices",
  "payload": {
    "devices": [
      {
        "snr": 12345678,
        "snrHex": "123456",
        "type": "20",
        "typeStr": "Plug receiver    "
      },
      {
        "snr": 12345678,
        "snrHex": "123456",
        "type": "21",
        "typeStr": "Actuator UP      "
      }
    ]
  }
}
```

#### Topic "wms-vb-rcv-weather-broadcast"

A message with this topic is emitted when the WMS Stick receives a weather broadcast.

> **Note:**  
> Weather broadcast is alpha state. Since I don't own the devices only mocking tests were possible.

```json
{
  "topic": "wms-vb-rcv-weather-broadcast",
  "payload": {
    "weather": {
      "snr": 627233,
      "snrHex": "219209",
      "ts": "2019-06-22T19:55:07.953Z",
      "temp": 18,
      "wind": 26,
      "lumen": 8372,
      "rain": true
    }
  }
}
```

#### Topic "wms-vb-cmd-result-set-position"

If command confirmation is enabled a message with this topic is emitted to confirm the
command `wmsStick.vnBlindSetPosition(...)`.

```json
{
  "topic": "wms-vb-cmd-result-set-position",
  "payload": {
    "error": "",
    "snr": 664681,
    "snrHex": "69240A",
    "name": "Kitchen right",
    "position": 0,
    "angle": -100
  }
}
```

#### Topic "wms-vb-cmd-result-stop"

If command confirmation is enabled a message with this topic is emitted to confirm the
command `wmsStick.vnBlindStop(...)`. The message is sent for each stopped blind.

```json
{
  "topic": "wms-vb-cmd-result-stop",
  "payload": {
    "error": "",
    "snr": 664681,
    "snrHex": "69240A",
    "name": "Kitchen right"
  }
}
```

#### Topic "wms-vb-blind-position-update"

A message with this topic is emitted, when a change of the position of
a blind is detected or function vnBlindGetPosition() is called.

```json
{
  "topic": "wms-vb-blind-position-update",
  "payload": {
    "snr": 664681,
    "snrHex": "69240A",
    "name": "Kitchen right",
    "position": 0,
    "angle": -100,
    "moving": false
  }
}
```

### Methods

#### wmsStick.addVnBlind(snr,name)

The method adds a venetian blind to the stick's devices list.

**Parameters:**

- **snr**  
  Serial number of the receiver ("WMS Plug receiver" or "WMS Actuator UP") as printed on the device.
- **name**  
  Logical name of the venetian blind, for example "Living room west".

**Returns:**

The method returns a object of type `WmsVbVnBlind`.

#### wmsStick.vnBlindRemove(blindId)

The method removes one or all venetian blinds of the stick's devices list.

**Parameters:**

- **blindId**  
  Optional ID of a blind. This parameter may be the `snr`, the `snrHex` or the `name` of a venetian blind.  
  If **blindId** is omitted, all blinds are removed.

**Returns:**

The method returns teh number of removed blinds.

#### wmsStick.vnBlindGetPosition(blindId)

Requests the current position of a desired venetian blind.

**Parameters:**

- **blindId**  
  Optional ID of a blind. This parameter may be the `snr`, the `snrHex` or the `name` of a venetian blind.  
  If **blindId** is omitted, position of all blinds is requested.

**Callback messages:**

- **Topic wms-vb-cmd-result-get-position**  
  Confirmation of command.
- **Topic wms-vb-blind-position-update**  
  This message is sent for each blind cencerned regardless of whether
  the position of the blind has changed since the last position
  determination or not.

#### wmsStick.setPosUpdInterval(intervalMsec)

The function sets the interval at which the position of the blinds is read.
In the specified interval the function `vnBlindGetPosition()` is automatically executed for each assigned blind.
If you omit the interval or set it to less than 5000 msec, the automatic update of the position is disabled.

**Parameters:**

- **intervalMsec**  
  Interval for reading current blind position in milliseconds.

**Callback messages:**

- **Topic wms-vb-blind-position-update**  
  This message is emitted when a blind position/angle changes.

#### wmsStick.setWatchMovingBlindsInterval(intervalMsec)

The function sets the interval at which the position of the blinds is read for all blinds detected as moving.
In the specified interval the function `vnBlindGetPosition()` is automatically executed for each blind until
not moving any more.
If you omit the interval or set it to less than 100 msec, the automatic update of the position is disabled.

**Parameters:**

- **intervalMsec**  
  Interval for watching current blind position in milliseconds.

**Callback messages:**

- **Topic wms-vb-blind-position-update**  
  This message is emitted when a blind position/angle changes.

#### wmsStick.setCmdConfirmationNotificationEnabled(boolean)

Enabling/disabling callback messages "wms-vb-cmd-result-set-position" and "wms-vb-cmd-result-stop".
By default they are disabled.

**Parameters:**

- **boolean**  
  If parameter evaluates to true the callcacks for command confirmations are enabled.

#### wmsStick.vnBlindSetPosition(blindId,position,angle)

Moves the venetian blind to the desired position

**Parameters:**

- **blindId**  
  This parameter may be the `snr`, the `snrHex` or the `name` of a venetian blind.
- **position**  
  Level of the blind in percent from 0 to 100. At position 0 the blind is completely opened. Set the `angle` to -100 to
  completely retract the blind into the cover. At `position` 100 the blind is fully closed.
- **angle**  
  Angle of the blind's slats in percent from -100 to 100. At `angle` -100 the slats are completely inclined inwards.
  At `angle` 0 the slats are in horizontal position. At `angle` 100 the slats are completely inclined outwards.

**Callback messages:**

- **Topic wms-vb-cmd-result-set-position**  
  Confirmation of command.
- **Topic wms-vb-blind-position-update**  
  This message is emitted together with the command's successful confirmation when the position/angle of the blind
  changes.

#### wmsStick.vnBlindSlatUp(blindId)

The slats tilt up. (The angle is decreased to the next position.)  
Available positions of the slats [%]: -100, -66, -33, 0, 33, 66 , 100  
When the end position of +/-100% is reached, no more movement takes place (no up/down).

**Parameters:**

- **blindId**  
  This parameter may be the `snr`, the `snrHex` or the `name` of a venetian blind.

**Callback messages:**`

- **Topic wms-vb-blind-position-update**  
  This message is emitted when the position/angle of the blind changes.

#### wmsStick.vnBlindSlatdown(blindId)

The slats tilt down. (The angle is increased to the next position.)  
Available positions of the slats [%]: -100, -66, -33, 0, 33, 66 , 100  
When the end position of +/-100% is reached, no more movement takes place (no up/down).

**Parameters:**

- **blindId**  
  This parameter may be the `snr`, the `snrHex` or the `name` of a venetian blind.

**Callback messages:**

- **Topic wms-vb-blind-position-update**  
  This message is emitted when the position/angle of the blind changes.

#### wmsStick.vnBlindStop(blindId)

Stops the venetian blind. Currently progressed requests of `vnBlindSetPosition(...)` of the blinds concerned are
canceled.

**Parameters:**

- **blindId**
    - This parameter may be the `snr`, the `snrHex` or the `name` of a venetian blind.
    - If **blindId** is omitted, a stop request is sent to all blinds.

**Callback messages:**

- **Topic wms-vb-cmd-result-stop**  
  Confirmation of command. The message is sent for each stopped blind.
- **Topic wms-vb-blind-position-update**  
  This message is emitted after stopping the blind when the position/angle of the blind changes.

#### wmsStick.vnBlindsList()

The method returns an array of venetian blinds assigned to the stick with method `addVnBlind()`.

```js
[
    {
        "snr": 12345678,
        "snrHex": "123456",
        "type": "20",
        "typeStr": "Plug receiver    "
    },
    {
        "snr": 12345678,
        "snrHex": "123456",
        "type": "21",
        "typeStr": "Actuator UP      "
    }
]
```

#### wmsStick.scanDevices(options)

The method starts the scanning. The WMS Stick scans the operating range for receivers.

Found devices are logged on console and the stick's callback function is called with a message.

- **options**  
  Parameter `options` is optional.  
  **`{ autoAssignBlinds: true }`**: The venetian blinds assigned to the
  stick are cleared. Scanned devices of types 20 (Actuator UP) and 21 (Plug receiver) are automatically assigned to the
  stick.

**Callback messages:**

- **Topic wms-vb-scanned-devices**  
  Confirmation of command.

#### wmsStick.getLastWeatherBroadcast()

The method returns the last received weather broadcast.

```json
{
  "snr": 627233,
  "snrHex": "219209",
  "ts": "2019-06-22T19:55:07.953Z",
  "temp": 18,
  "wind": 26,
  "lumen": 8372,
  "rain": true
}
```

#### wmsStick.vnBlindWaveRequest(blindId)

This function causes the specified blind to performs a short up/down move. It can be used to identify the specified
blind.

**Parameters:**

- **blindId**  
  This parameter may be the `snr`, the `snrHex` or the `name` of a venetian blind.

**Callback messages:**

- **none**

#### wmsStick.getStatus()

This function returns the current communication statistics of the stick.
The function does not initiate any WMS communication.

**Returns:**

```json
{
  "name": "/dev/ttyUSB0",
  "startupTs": "2020-01-05T21:23:08.850Z",
  "status": "ready",
  "posUpdIntervalMsec": 5000,
  "wmsSentCount": 7,
  "wmsSentTs": "2020-01-05T21:23:08.850Z",
  "wmsRecievedCount": 50,
  "wmsRecievedTs": "1970-01-01T00:00:00.000Z",
  "wmsComDuration": 9802,
  "wmsComMaxDuration": 373,
  "wmsComAvgDuration": 196,
  "wmsRetryCount": 0,
  "wmsRetryTs": "1970-01-01T00:00:00.000Z",
  "wmsRetryRate": 0,
  "wmsTimeoutCount": 2,
  "wmsTimeoutTs": "2020-01-05T21:23:08.840Z",
  "wmsTimeoutRate": 0.2857142857142857
}
``` 

**Callback messages:**

- **none**

#### wmsStick.vnBlindGetStatus(blindId)

This function returns the current blind status, including the current position.
The function does not initiateany WMS communication with the actuators.

**Parameters:**

- **blindId**  
  Optional ID of a blind. This parameter may be the `snr`, the `snrHex` or the `name` of a venetian blind.  
  If **blindId** is omitted, status of all blinds is returned.

**Returns:**

```json
[
  {
    "snr": 580911,
    "snrHex": "2FDD08",
    "name": "Plug receiver 580911 (2FDD08)",
    "creationTs": "2020-01-05T21:23:09.604Z",
    "posCurrent": {
      "pos": -1,
      "ang": 0
    },
    "posRequested": {
      "pos": 0,
      "ang": 0
    },
    "wmsSentCount": 0,
    "wmsSentTs": "1970-01-01T00:00:00.000Z",
    "wmsRecievedCount": 0,
    "wmsRecievedTs": "1970-01-01T00:00:00.000Z",
    "wmsComDuration": 0,
    "wmsComMaxDuration": 0,
    "wmsComAvgDuration": 0,
    "wmsRetryCount": 0,
    "wmsRetryTs": "1970-01-01T00:00:00.000Z",
    "wmsRetryRate": 0,
    "wmsTimeoutCount": 0,
    "wmsTimeoutTs": "1970-01-01T00:00:00.000Z",
    "wmsTimeoutRate": 0
  },
  {
    ...
  }
]
``` 

## Credits

Many thanks to "Pman" and "willjoha" on
https://forum.iobroker.net/topic/7336/iobroker-mit-warema-wms-web-control!
Your research is the basis for this package.

## Change Log

- 2.0.4 May/25/2022
    - Removed debug output in logger.
    - Fixed version dependencies to proper(older) versions of serialport so module can be instaled on older raspberry pi
      os.
- 2.0.0 November/11/2021
    - Added support for device type 25 "radio motor".
    - Added functionality to watch position of moving blinds until they are stopped. See
      method `setWatchMovingBlindsInterval()`.
    - Command confirmation callbacks are initially disabled and may be enabed
      by `setCmdConfirmationNotificationEnabled()`.
    - After stopping a blind by `vnBlindStop()` a `wms-vb-blind-position-update` is triggeed automatically.
    - `wms-vb-blind-position-update` directly after moving commands give current position with attribute "moving"
      instead of target position.
- 1.1.19, 1.1.20 September/27/2021
    - Added attribute `moving` in payload of topic `wms-vb-blind-position-update`
    - Added missing dependency @serialport/parser-delimiter
- 1.1.17, 1.1.18
    - Fixed issue in logger (files appended istead of rewritten)
- 1.1.15, 1.1.16
    - Fixed errors in case sensitive writing of time stamp attributes (consitantly \*Ts instead of \*TS).
- 1.1.14
    - Added `vnBlindRemove()`.
    - Fixed errors in `listWmsStickSerialPorts()`.
- 1.1.13
    - Fixed swapped actuator type string 20/21.
    - `vnBlindGetPosition()` and `vnBlindGetStatus()` can optionally
      be called without blindId. Then command is performed for each
      registered blind.
    - `vnBlindGetStatus()` returns an array in payload.
- 1.1.11, 1.1.12
    - Extensions an fixes in WMS communication statistics and getStatus() functions.
    - prevent parallel runs of scanDevices().
- 1.1.10
    - Function `vnBlindGetPosition()`: Sends topic wms-vb-blind-position-update
      regardless of whether the position of the blind
      has changed since the last position determination or not.
    - Fixed issues in README.md.
- 1.1.9
    - Fixed issues in README.md.
- 1.1.8
    - Fixed error in `scanDevices()`
    - Internal: Use single logger
- 1.1.7, 1.1.6, 1.1.5, 1.1.4
    - Fixed minor issues in README.md *[sigh]*.
- 1.1.3
    - Added method `getStatus()`
    - Added option `autoAssignBlinds=true` for `method scanDevices()`
    - Added `wmsComMaxDuration` and `wmsComAvgDuration` in statistics of stick and blind (Methods `vnBlindGetStatus()`
      and `getStatus()`).
    - Fixed issues in README.md.

## License

*warema-wms-venetian-blinds* is MIT licensed and all it's dependencies are MIT licensed.

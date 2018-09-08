var noble = require('noble');
var osc = require('node-osc');

var SERVICE_ID = '1811';
var CHARACTERISTICS_ID = '2a56';
var CHARACTERISTICS2_ID = '2a57';

var peripheralIdOrAddress = process.argv[2] && process.argv[2].toLowerCase();
var oscPort = process.argv[3] && ~~process.argv[3];
var oscClient = null;

var re = new RegExp(/wrlds/ig);

if (oscPort) {
    oscClient = new osc.Client('127.0.0.1', oscPort);
}

noble.on('stateChange', function(state) {
    if (state === 'poweredOn') {
        console.log('Scanning for BLE devices...');
        noble.startScanning([], false);
    }
    else {
        noble.stopScanning();
    }
})

function explore(peripheral) {
    console.log('Connecting to device...');

    peripheral.on('disconnect', function() {
        process.exit(0);
    });

    peripheral.connect(function(error) {
        peripheral.discoverServices([], function(error, services) {
            services.forEach(service => {
                console.log('Service', service.uuid);
                if (service.uuid == SERVICE_ID) {
                    console.log('Found correct service.');

                    service.discoverCharacteristics([], function(error, characteristics) {
                        characteristics.forEach(c => {
                            console.log('Characteristic ' + c.uuid);

                            if (c.uuid == CHARACTERISTICS_ID) {
                                console.log('Found correct characteristic.');

                                c.subscribe(function(error) {
                                    console.log('Subscribed.');
                                });

                                c.on('read', function(data, isNotification) {
                                    console.log('Got bytes', data);
                                    var acc = 0.0;
                                    var buffer = new Buffer(data);
                                    for(var i=0; i<10; i++) {
                                        var x = buffer.readInt16LE(i * 2)
                                        acc += Math.abs(x);
                                    }
                                    acc /= 10;
                                    acc *= 100;
                                    acc /= 32768;
                                    console.log('Bounce! ' + acc + '%');

                                    if (oscClient) {
                                        console.log('Sending OSC...');
                                        oscClient.send('/wrlds/' + peripheral.id + '/bounce', acc, function () {});
                                    }
                                });
                            }

                            if (c.uuid == CHARACTERISTICS2_ID) {
                                console.log('Found correct characteristic.');

                                c.subscribe(function(error) {
                                    console.log('Subscribed.');
                                });

                                c.on('read', function(data, isNotification) {
                                    console.log('Got bytes', data);
                                    var buffer = new Buffer(data);
                                    var x = buffer.readInt16LE(0)
                                    var y = buffer.readInt16LE(2)
                                    var z = buffer.readInt16LE(4)
                                    console.log('buffer',x,y,z);
                                    if (oscClient) {
                                        console.log('Sending OSC...');
                                        oscClient.send('/wrlds/' + peripheral.id + '/rotate', [x, y, z], function () {});
                                    }
                                });
                            }
                        });
                    });
                }
            });
        });
    });
}

noble.on('discover', function(peripheral) {
    if (peripheralIdOrAddress) {
        if (peripheral.id === peripheralIdOrAddress || peripheral.address === peripheralIdOrAddress) {
            noble.stopScanning();
            explore(peripheral);
        }
    }else{
        console.log('discovered #' + peripheral.id + ': ' + peripheral.advertisement.localName);
        if (re.test(peripheral.advertisement.localName) && peripheral.connectable) {
            console.log('found connectable device.', peripheral.id)
        }
    }
});

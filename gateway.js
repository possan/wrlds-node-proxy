var noble = require('noble');
var async = require('async');

var service_id = '1811';
var characteristic_id = '2a56';

var peripheralIdOrAddress = process.argv[2] && process.argv[2].toLowerCase();

noble.on('stateChange', function(state) {
  if (state === 'poweredOn') {
    noble.startScanning();
  } else {
    noble.stopScanning();
  }
});

var re = new RegExp(/hello wrlds/ig);


function explore(peripheral) {
    console.log('services and characteristics:');

    peripheral.on('disconnect', function() {
        process.exit(0);
    });

    peripheral.connect(function(error) {
        peripheral.discoverServices([], function(error, services) {

            services.forEach(service => {
                console.log('service', service.uuid);

                if (service.uuid != service_id) {
                    return;
                }

                console.log('found service.');

                service.discoverCharacteristics([], function(error, characteristics) {
                    characteristics.forEach(c => {
                        console.log('characteristic ' + c.uuid);

                        if (c.uuid != characteristic_id) {
                            return;
                        }

                        console.log('found characteristic');

                        c.subscribe(function(error) {
                            console.log('subscribed.');
                        });

                        c.on('read', function(data, isNotification) {
                            console.log('Got data', data);
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
                        });
                    });
                });
            });
        });
    });
}


if (peripheralIdOrAddress) {
    noble.on('discover', function(peripheral) {
        if (peripheral.id === peripheralIdOrAddress || peripheral.address === peripheralIdOrAddress) {
            noble.stopScanning();

            console.log('peripheral with ID ' + peripheral.id + ' found');
            var advertisement = peripheral.advertisement;

            var localName = advertisement.localName;
            var txPowerLevel = advertisement.txPowerLevel;
            var manufacturerData = advertisement.manufacturerData;
            var serviceData = advertisement.serviceData;
            var serviceUuids = advertisement.serviceUuids;

            if (localName) {
                console.log('  Local Name        = ' + localName);
            }

            if (txPowerLevel) {
                console.log('  TX Power Level    = ' + txPowerLevel);
            }

            if (manufacturerData) {
                console.log('  Manufacturer Data = ' + manufacturerData.toString('hex'));
            }

            if (serviceData) {
                console.log('  Service Data      = ' + JSON.stringify(serviceData, null, 2));
            }

            if (serviceUuids) {
                console.log('  Service UUIDs     = ' + serviceUuids);
            }

            console.log();
            explore(peripheral);
        }
    });
} else {
    noble.on('discover', function(peripheral) {
        console.log('discovered #' + peripheral.id + ': ' + peripheral.advertisement.localName);
        //   console.log('\tcan I interest you in any of the following advertised services:');
        //   console.log('\t\t' + JSON.stringify(peripheral.advertisement.serviceUuids));
        if (re.test(peripheral.advertisement.localName)) {
            console.log('found device.')
            if (peripheral.connectable) {
                console.log('found connectable device.', peripheral.id)
            }
        }
        //   var serviceData = peripheral.advertisement.serviceData;
        //   if (serviceData && serviceData.length) {
        //     console.log('\there is my service data:');
        //     for (var i in serviceData) {
        //       console.log('\t\t' + JSON.stringify(serviceData[i].uuid) + ': ' + JSON.stringify(serviceData[i].data.toString('hex')));
        //     }
        //   }
        //   if (peripheral.advertisement.manufacturerData) {
        //     console.log('\there is my manufacturer data:');
        //     console.log('\t\t' + JSON.stringify(peripheral.advertisement.manufacturerData.toString('hex')));
        //   }
        //   if (peripheral.advertisement.txPowerLevel !== undefined) {
        //     console.log('\tmy TX power level is:');
        //     console.log('\t\t' + peripheral.advertisement.txPowerLevel);
        //   }
        //   console.log();
    });
}

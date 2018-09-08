# WRLDS Bluetooth Proxy

## Install

`npm i`

## List devices

`node gateway.js`

Look for `found connectable device.` - next to it is an id number, this is your way of identifying your device.

## Get events

`node gateway.js [yourdeviceid]` eg. `node gateway.js d65786f915894648b6cf68b9fb613278`

You should see some lines printed out, and when the ball detects a bounce, you should get a line that looks like `Bounce! 42.67364501953125%`

## Send OSC

`node gateway.js [yourdeviceid] [osc-port]` eg. `node gateway.js d65786f915894648b6cf68b9fb613278 8888`

This will send an OSC event named `/wrlds/[deviceid]/bounce` with a float property indicating the amount

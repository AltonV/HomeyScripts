/*
  Returns true if any light is turned on
 */

const devices = await Homey.devices.getDevices();

let lightsOn = 0;

// Loop over all devices
for (const device of Object.values(devices)) {
  if (!device.capabilitiesObj) continue;

  // Check if the device is a light and continue if not
  if ((!device.virtualClass && !device.class.match("light"))
    || (device.virtualClass && !device.virtualClass.match("light"))) continue;

  // Check if the device is on
  if (device.capabilitiesObj["onoff"].value) {
    console.log(device.name);
    lightsOn += 1;
  }
}

return (lightsOn > 0)

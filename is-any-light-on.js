/*
  Returns true if any light is turned on.

  Argument:
    The zones to check separated by |.
    If run without any argument then all zones is checked.

  Variables:
    includeSubzones: Whether the script should include subzones or not.

 */

const includeSubzones = true;


const devices = await Homey.devices.getDevices();
const zones = await Homey.zones.getZones();

let lightsOn = 0;

// Splits argument with |
if (args[0]) args = args[0].split("|");

// Loop over all devices
for (const device of Object.values(devices)) {
  if (!device.capabilitiesObj) continue;

  // Check if the device is a light and continue if not
  if ((!device.virtualClass && !device.class.match("light"))
    || (device.virtualClass && !device.virtualClass.match("light"))) continue;
  // Checks if zone matches a zone in the arguments (if not using subzone matching)
  if (args.length && !includeSubzones && !args.includes(zones[device.zone].name)) continue;

  // Checks if zone matches or is a subzone to a zone in the arguments
  if (args.length && includeSubzones) {
    let z = device.zone;
    let match = args.includes(zones[z].name);

    while (z != null && match === false) {
      if (args.includes(zones[z].name)) match = true;
      z = zones[z].parent;
    }

    if (!match) continue;
  }

  // Check if the device is on
  if (device.capabilitiesObj["onoff"].value) {
    console.log(device.name);
    lightsOn += 1;
  }
}

return (lightsOn > 0)

/*
  Set the color of all supported lights in the specified zones.
  If no zone is specified it changes the color of all lights.
  Updated: 2025-04-21

  Argument:
    The dim value and zones (optional) separated by |.
    Examples:
    '#ff0000|Kitchen|Hallway'
    '#00ff00|Living Room'
    '#0000ff|Office'

  Variables:
    duration: The duration in seconds for the transition to the new color.

    include_subzones: Whether the script should include subzones or not.

    delay_between_devices: The delay between commands to devices in milliseconds.

*/

const duration = 0.5;
const include_subzones = true;
const delay_between_devices = 0;



// ====================================== //

if (!args[0]) {
  throw new Error("Must be run with an argument");
}

// Parse argument
args = args[0].split("|");
const color = args.shift();

const devices = await Homey.devices.getDevices();
const zones = await Homey.zones.getZones();

let allZonesId = [];

//Get the id's of all zones
if (include_subzones) for (const a of args) {
  allZonesId = allZonesId.concat((await getSubZones(a)).map(i => i.id));
}

for (const device of Object.values(devices)) {
  // Check if the device is a light
  if (device.class !== 'light' && device.virtualClass !== 'light') continue;

  // Simple zone matching
  if (args.length && !include_subzones && !args.includes(zones[device.zone].name)) continue;

  // Advanced zone matching
  if (args.length && include_subzones && !allZonesId.includes(device.zone)) continue;

  if (['light_hue', 'light_saturation'].every(c => device.capabilities.includes(c))) {
    setDeviceProperty(device.id, 'color', color, duration);
    if (delay_between_devices > 0) await wait(delay_between_devices);
  }
}


async function getSubZones(startZone) {
  let zones = await Homey.zones.getZones();
  let result = _.filter(zones, { 'name': startZone });
  if (!result[0]) return undefined;
  let id = _.map(result, 'id');

  let arr = [];
  while (id.length) {
    arr = _.filter(zones, function (z) {
      return id.includes(z.parent);
    });
    result = _.concat(result, arr);
    id = _.map(arr, 'id');
  }
  return result;
}

async function setDeviceProperty(device, type, value, duration = 0) {
  await Homey.flow.runFlowCardAction({
    id: `homey:device:${device}:${type}`,
    duration: duration,
    args: { [type]: value }
  });
}

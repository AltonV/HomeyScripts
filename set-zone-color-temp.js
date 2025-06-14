/*
  Set the color temperature of all supported lights in the specified zones either with an absolute or relative percentage value.
  If no zone is specified it changes the color temperature all lights.
  Updated: 2025-06-14

  Argument:
    The color temperature (in percentage) and zones (optional) separated by |.
    Examples:
    '60|Kitchen|Hallway'  absolute value
    '+20|Kitchen|Hallway' relative value
    '-20|Kitchen|Hallway' relative value

  Variables:
    duration: The duration in seconds for the transition to the new color temperature.

    include_subzones: Whether the script should include subzones or not.

    delay_between_devices: The delay between commands to devices in milliseconds.

    use_group_instead: If set to true, use the groups instead of the individual devices.
      If set to false, use the individual devices and ignore groups.

    ignoreDevices: A list of devices to ignore.
    You can either use the device ID or name.

*/

//===============================================
//  CONFIG SECTION START
//===============================================

const duration = 0.5;
const include_subzones = true;
const delay_between_devices = 0;
const use_group_instead = false;

const ignoreDevices = [
  //'43b17eb6-0c0d-4e20-9e23-dd1579fa7c3b',
];


//===============================================
//  CONFIG SECTION END
//===============================================

if (!args[0]) {
  throw new Error("Must be run with an argument");
}

// Parse argument
let relative = false;
args = args[0].split("|");
let temp = parseInt(args[0]);
if (temp || temp === 0) {
  if (args[0].charAt(0) === "+" || args[0].charAt(0) === "-") relative = true;
  args.shift();
  temp = Math.min(1, Math.max(-1, temp / 100));
} else {
  throw new Error("Not a number");
}

const devices = await Homey.devices.getDevices();
const zones = await Homey.zones.getZones();

let allZonesId = [];

//Get the id's of all zones
if (include_subzones) for (const a of args) {
  allZonesId = allZonesId.concat((await getSubZones(a)).map(i => i.id));
}

// Filter out devices
let devicesFiltered = Object.values(devices).filter(function (device) {
  // Check if the device is a light
  if (device.class !== 'light' && device.virtualClass !== 'light') return false;

  // Ignore devices
  if (ignoreDevices.includes(device.id) || ignoreDevices.includes(device.name)) return false;

  // Simple zone matching
  if (args.length && !include_subzones && !args.includes(zones[device.zone].name)) return false;

  // Advanced zone matching
  if (args.length && include_subzones && !allZonesId.includes(device.zone)) return false;

  // Check if the light supports color temperature
  if (!device.capabilities.includes('light_temperature')) return false;

  // Filter out either groups or devices that are part of groups
  if (use_group_instead && device.group ||
    !use_group_instead && device.driverId.includes('virtualdrivergroup')) return false;

  return true;
});

for (const device of devicesFiltered) {
  let val = (relative ? device.capabilitiesObj.light_temperature.value + temp : temp);
  setDeviceProperty(device.id, 'temperature', val, duration);
  if (delay_between_devices > 0) await wait(delay_between_devices);
}


async function getSubZones(startZone) {
  let zones = await Homey.zones.getZones();
  let result = _.filter(zones, { 'name': startZone });
  if (!result.length) return [];
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

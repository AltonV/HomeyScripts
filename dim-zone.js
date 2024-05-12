/*
  Dims all lights in the specified zones either with an absolute or relative value.
  If no zone is specified it dims all lights.
  Can also turn on/off non-dimmable lights if the other lights are over/under a specific threshold.
  Updated: 2024-05-12

  Argument:
    The dim value and zones (optional) separated by |.
    Examples:
    '80|Kitchen|Hallway'  absolute value
    '+20|Kitchen|Hallway' relative value
    '-20|Kitchen|Hallway' relative value

  Variables:
    include_subzones: Whether the script should include subzones or not.

    non_dim_threshold: Threshold at which non-dimmable lights will be turned on, or off if below.
      Set to 0 to ignore these lights.

    delay_between_devices: The delay between commands to devices in milliseconds.

*/

const include_subzones = true;
const non_dim_threshold = 0;
const delay_between_devices = 0;



// ====================================== //

let dimVal;
let relative = false;

// Parse argument
if (args[0]) {
  args = args[0].split("|");
  dimVal = parseInt(args[0]);
  if (dimVal || dimVal == 0) {
    if (args[0].charAt(0) == "+" || args[0].charAt(0) == "-") relative = true;
    args.shift();
    dimVal = Math.min(1, Math.max(0, dimVal / 100));
  } else {
    throw new Error("Not a number");
  }
} else {
  throw new Error("Must be run with an argument");
}

const devices = await Homey.devices.getDevices();
const zones = await Homey.zones.getZones();

let dimValArr = [];
let nonDimDevices = [];
let allZonesId = [];

//Get the id's of all zones
if (include_subzones) for (const a of args) {
  for (const z of await getSubZones(a)) {
    allZonesId.push(z.id);
  }
}

for (const device of Object.values(devices)) {
  // Check if the device is a light
  if (device.class != 'light' && device.virtualClass != 'light') continue;

  // Simple zone matching
  if (args.length && !include_subzones && !args.includes(zones[device.zone].name)) continue;

  // Advanced zone matching
  if (args.length && include_subzones && !allZonesId.includes(device.zone)) continue;

  if (device.capabilitiesObj.dim) {
    let val = (relative && device.capabilitiesObj.onoff.value ? device.capabilitiesObj.dim.value + dimVal : dimVal);
    device.setCapabilityValue('dim', val);  // Dim the light
    dimValArr.push(val);
    if (delay_between_devices > 0) await wait(delay_between_devices);

  } else if (device.capabilitiesObj.onoff && non_dim_threshold > 0) {
    nonDimDevices.push(device);
  }
}

if (nonDimDevices.length == 0) return;

// Calculate the average dim value
var dimAvg = _.mean(dimValArr);

// Turns on/off non-dimmable lights
for (const device of Object.values(nonDimDevices)) {
  device.setCapabilityValue('onoff', dimAvg >= non_dim_threshold / 100);
  if (delay_between_devices > 0) await wait(delay_between_devices);
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

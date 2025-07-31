/*
  Randomly set the color of all supported lights in the specified zones.
  If no zone is specified it changes the color of all lights.

  Use a flow with the starting card every 1 seconds.
  You might need to increase that time if it doesn't work.
  Updated: 2025-07-31

  Argument (optional):
    Zones separated by |.
    Examples:
    'Kitchen|Hallway|Bathroom'
    'Living Room|Hallway'
    'Office'

  Variables:
    interval_min: Minimum random time in seconds between color changes.

    interval_max: Maximum random time in seconds between color changes.

    duration: The duration in seconds for the transition to the new color.

    include_subzones: Whether the script should include subzones or not.

    delay_between_devices: The delay between commands to devices in milliseconds.

    use_group_instead: If set to true, use the groups instead of the individual devices.
      If set to false, use the individual devices and ignore groups.

    color_list: A list of colors to randomly choose from.

    ignore_devices: A list of devices to ignore.
    You can either use the device ID or name.

*/

//===============================================
//  CONFIG SECTION START
//===============================================

const interval_min = 10;
const interval_max = 30;
const duration = 2;
const include_subzones = true;
const delay_between_devices = 0;
const use_group_instead = false;

const color_list = [
  '#FF0000', // Red
  '#008000', // Green
  '#0000FF', // Blue
  '#FFFF00', // Yellow
  '#FF00FF', // Magenta
  '#8000FF', // Violet
  '#FFA500', // Orange
  '#FF0080', // Hot Pink
  '#00FF00', // Lime
]

const ignore_devices = [
  //'43b17eb6-0c0d-4e20-9e23-dd1579fa7c3b',
];


//===============================================
//  CONFIG SECTION END
//===============================================

const devices = await Homey.devices.getDevices();
const zones = await Homey.zones.getZones();

let data = global.get(__filename__) || {};
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
  if (ignore_devices.includes(device.id) || ignore_devices.includes(device.name)) return false;

  // Simple zone matching
  if (args.length && !include_subzones && !args.includes(zones[device.zone].name)) return false;

  // Advanced zone matching
  if (args.length && include_subzones && !allZonesId.includes(device.zone)) return false;

  // Filter out either groups or devices that are part of groups
  if (use_group_instead && device.group ||
    !use_group_instead && device.driverId.includes('virtualdrivergroup')) return false;

  // Check if the light supports color
  if (!['light_hue', 'light_saturation'].every(c => device.capabilities.includes(c))) return false;

  return true;
});

for (const device of devicesFiltered) {
  if (Date.now() < data[device.id]) continue;
  const interval = (Math.floor(Math.random() * (interval_max - interval_min)) + interval_min) * 1000;
  data[device.id] = Date.now() + interval;
  setDeviceProperty(device.id, 'color', _.sample(color_list), duration);
  if (delay_between_devices > 0) await wait(delay_between_devices);
}

global.set(__filename__, data);


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

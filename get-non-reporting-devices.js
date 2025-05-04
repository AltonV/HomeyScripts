/*
  Updated: 2025-05-04

  This script identifies unresponsive devices in Homey by checking if the last update time of their capabilities exceeds configured thresholds.
  A device is considered unresponsive only if all of its capabilities exceed the threshold.
  The script returns true if any device is unresponsive and add the affected devices, and which zone it is in, to the 'Unresponsive Devices' tag.

  Example flow: https://github.com/AltonV/HomeyScripts/blob/main/pictures/get-non-reporting-devices-example-flow.png

  Variables:
    defaultThreshold:
      The default threshold in hours.

    capabilityThresholds:
      Custom thresholds, in hours, for specific capabilities.
      The list of capabilities can be found here. Use the ID.
      https://apps-sdk-v3.developer.homey.app/tutorial-device-capabilities.html

    ignoredNames:
      List of names that will be ignored.
      Uses case-sensitive partial matching.

    ignoredApps:
      List of apps to ignore.
      I would recommend using the app ID, which you can get from the app store URL.

    ignoredClasses: list of device classes to ignore.
      Use the class IDs from this list
      https://apps-sdk-v3.developer.homey.app/tutorial-device-classes.html

    updateOnOffStatus:
      Whether to update the onoff status of devices that has it.

    tagName:
      The name of the tag where the output is saved.

*/

//===============================================
//  CONFIG SECTION START
//===============================================

let defaultThreshold = 12;

let capabilityThresholds = {
  "measure_battery": 168, // Battery status is usually reported very rarely.
  "measure_temperature": 1,
};

let ignoredNames = [
  //"Keyfob",
];
let ignoredApps = [
  "virtualdriverinfrared", // Infrared devices
  //"virtualsocket", // Built-in virtual socket
  //"virtualbutton", // Built-in virtual button
  //"com.arjankranenburg.virtual", // Virtual Devices app
  //"nl.qluster-it.DeviceCapabilities", // Device Capabilities app
];
let ignoredClasses = [
  //"remote",
  //"sprinkler",
];

const updateOnOffStatus = true;

const tagName = "Unresponsive Devices";


//===============================================
//  CONFIG SECTION END
//===============================================

const toMs = (h = 0, m = 0, s = 0) => ((h * 60 * 60 + m * 60 + s) * 1000);

ignoredNames = ignoredNames.join("|");
ignoredApps = ignoredApps.join("|");

// Convert to timestamps
for (const [c, t] of Object.entries(capabilityThresholds)) {
  capabilityThresholds[c] = Date.now() - toMs(t);
}
defaultThreshold = Date.now() - toMs(defaultThreshold);

// Get all devices and zones
const devices = await Homey.devices.getDevices();
const zones = await Homey.zones.getZones();
const zigbeeState = await Homey.zigbee.getState();

let result = "";

// Loop over all devices
for (const device of Object.values(devices)) {
  // Skip ignored devices
  if (ignoredNames && device.name.match(ignoredNames)) continue;
  if (ignoredApps && device.driverId.match(ignoredApps)) continue;
  if (ignoredClasses.includes(device.virtualClass || device.class)) continue;

  // If the device is not available then include it and continue
  if (!device.available) {
    result += device.name + " - " + zones[device.zone].name + "\n";
    continue;
  }

  let updated = false;

  // Check last update for Zigbee devices and use the default threshold
  if (device.flags.includes('zigbee')) {
    updated = updated || (zigbeeState.nodes[device.settings.zb_ieee_address].lastSeen >= defaultThreshold);

    // Skip devices with no capabilities
  } else if (!device.capabilitiesObj || device.capabilities.length === 0) continue;

  // Loop over all capabilities
  for (const capability of Object.values(device.capabilitiesObj)) {
    // Checks if the capability has updated recently
    // If a specific threshold is set for the capability then it will be used, otherwise the default will be used.
    updated = updated || (capability.lastUpdated >= (capabilityThresholds[capability.id] || defaultThreshold));
  }

  // Update onoff status if enabled
  if (device.capabilities.includes('onoff')) try {
    await device.setCapabilityValue('onoff', device.capabilitiesObj['onoff'].value);
  } catch { }

  // Append the device to the output if it hasn't updated recently
  if (!updated) result += device.name + " - " + zones[device.zone].name + "\n";
}

console.log(result);

await tag(tagName, result);

return result.length > 0;

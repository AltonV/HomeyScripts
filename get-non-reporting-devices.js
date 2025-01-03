/*
  Updated: 2025-01-02

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

    tagName:
      The name of the tag where the output is saved.

*/

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

const tagName = "Unresponsive Devices";


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

let result = "";

// Loop over all devices
for (const device of Object.values(devices)) {
  if (!device.capabilitiesObj || device.capabilities.length == 0) continue;
  if (ignoredNames && device.name.match(ignoredNames)) continue;
  if (ignoredApps && device.driverId.match(ignoredApps)) continue;
  if (ignoredClasses.includes(device.virtualClass || device.class)) continue;

  let updated = false;

  // Loop over all capabilities
  for (const capability of Object.values(device.capabilitiesObj)) {
    updated = updated || (capability.lastUpdated >= (capabilityThresholds[capability.id] || defaultThreshold))
  }

  if (!updated) result += device.name + " - " + zones[device.zone].name + "\n";
}

console.log(result);

await tag(tagName, result);

return result.length > 0;

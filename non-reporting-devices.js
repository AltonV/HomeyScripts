/*
  Gets a list of devices that haven't reported for a set number of days.

  Returns true if any devices haven't reported in the specified time
  and outputs a list of devices to a tag that can be used in flows

  Variables:
    notReportedForDays: How long ago in days where the device should count as offline
    Overridden if the script is run with an argument.

    ignoredApps: ignored appids separated by |.
    By default homeys built-in virtual devices and the app Virtual Devices is ignored
    You can get the appid from the app store URL.

    ignoredClasses: ignored classids separated by |.
    https://apps-sdk-v3.developer.homey.app/tutorial-device-classes.html

    tagName: the name of the tag where the output is written to.

*/

let notReportedForDays = 7;

const ignoredApps = "vdevice|com.arjankranenburg.virtual";
const ignoredClasses = "";

const tagName = "Unresponsive Devices";


if (args[0]) {
  notReportedForDays = parseInt(args[0]);
  if (isNaN(notReportedForDays)) {
    throw new Error("Argument must be a number");
  }
}

const date = new Date();
date.setDate(date.getDate() - notReportedForDays);

// Get all devices and zones
const devices = await Homey.devices.getDevices();
const zones = await Homey.zones.getZones();

let result = false;
let resultText = "";

// Loop over all devices
for (const device of Object.values(devices)) {
  if (!device.capabilitiesObj || device.capabilities.length == 0) continue;
  if (ignoredApps && device.ownerUri.match(ignoredApps)) continue;
  if (ignoredClasses && device.class.match(ignoredClasses)) continue;

  let lastUpdate = 0;

  // Loop over all capabilities
  for (const capability of Object.values(device.capabilitiesObj)) {
    if (lastUpdate < capability.lastUpdated) {
      lastUpdate = capability.lastUpdated;
    }
  }
  if (lastUpdate <= date) {
    result = true;
    resultText += device.name + " - " + zones[device.zone].name + "\n";
  }
}

console.log(resultText);

tag(tagName, resultText);

return result;

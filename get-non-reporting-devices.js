/*
  Gets a list of devices that haven't reported for a set number of days.
  Updated: 2023-01-30

  Example flow: https://github.com/AltonV/HomeyScripts/blob/main/pictures/get-non-reporting-devices-example-flow.png

  Returns true if any devices haven't reported in the specified time
  and outputs a list of devices to a tag that can be used in flows

  Argument:
    The script can take two numbers separated by | as an argument.
    First number changes value of 'notReportedForDays' and the second changes 'notReportedForDaysBattery'.

  Variables:
    ignoredNames: list of ignored names separated by |.
    Uses partial matching. Case sensitive.

    notReportedForDays: How long ago in days where the device should count as offline
    Overridden if the script is run with an argument.

    notReportedForDaysBattery: Same as 'notReportedForDays'
    but for devices that only reports battery status

    ignoredApps: ignored appids separated by |.
    By default homeys built-in virtual devices and the app Virtual Devices is ignored
    You can get the appid from the app store URL.

    ignoredClasses: ignored classids separated by |.
    https://apps-sdk-v3.developer.homey.app/tutorial-device-classes.html

    tagName: the name of the tag where the output is written to.

*/

let notReportedForDays = 7;
let notReportedForDaysBattery = 20;

const ignoredNames = "";
const ignoredApps = "vdevice|com.arjankranenburg.virtual";
const ignoredClasses = "";

const tagName = "Unresponsive Devices";

if (args[0]) {
  let argParts = args[0].split('|');
  if (argParts.length > 1) {
    notReportedForDays = parseInt(argParts[0]);
    notReportedForDaysBattery = parseInt(argParts[1]);
  } else {
    notReportedForDays = parseInt(args[0]);
  }
  if (isNaN(notReportedForDays) || isNaN(notReportedForDaysBattery)) {
    throw new Error("Argument must be a number");
  }
}

const date = new Date();
date.setDate(date.getDate() - notReportedForDays);
const dateBattery = new Date();
dateBattery.setDate(dateBattery.getDate() - notReportedForDaysBattery);

// Get all devices and zones
const devices = await Homey.devices.getDevices();
const zones = await Homey.zones.getZones();

let result = false;
let resultText = "";

// Loop over all devices
for (const device of Object.values(devices)) {
  if (!device.capabilitiesObj || device.capabilities.length == 0) continue;
  if (ignoredNames && device.name.match(ignoredNames)) continue;
  if (ignoredApps && device.ownerUri.match(ignoredApps)) continue;
  if (ignoredClasses && device.class.match(ignoredClasses)) continue;

  let lastUpdate = 0;

  // Check if the device only reports battery status
  let onlyBattery = false;
  if (device.capabilities.includes("measure_battery") && device.capabilities.length == 1) {
    onlyBattery = true;
  }

  // Loop over all capabilities
  for (const capability of Object.values(device.capabilitiesObj)) {
    if (lastUpdate < capability.lastUpdated) {
      lastUpdate = capability.lastUpdated;
    }
  }
  if ((lastUpdate <= date && !onlyBattery) || (lastUpdate <= dateBattery && onlyBattery)) {
    result = true;
    resultText += device.name + " - " + zones[device.zone].name + "\n";
  }
}

console.log(resultText);

await tag(tagName, resultText);

return result;

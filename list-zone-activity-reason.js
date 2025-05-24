// List all active zones and the reason they are active.

const zones = await Homey.zones.getZones();
const devices = await Homey.devices.getDevices();

for (const zone of Object.values(zones)) {
  if (!zone.active) continue; // Skip inactive zones

  log("=".repeat(5), zone.name); // Print zone name
  for (const origin of zone.activeOrigins) { // Loop through reasons why zone i active
    const match = origin.match(/(?<=homey:)([^:]*):([^:]*):*(.*)/);
    if (match[1] === "device") { // If the reason is a device
      try {
        // Print the name of the device and the reason it is active
        log("Device:", devices[match[2]].name, "|", devices[match[2]].capabilitiesObj[match[3]].title);
      } catch (e) {
        log(e);
      }
    } else if (match[1] === "zone") { // If the reason is a sub-zone
      try {
        // Print the name of the sub-zone
        log("Zone:", zones[match[2]].name);
      } catch (e) {
        log(e);
      }
    }
  }
  log(" ");
}

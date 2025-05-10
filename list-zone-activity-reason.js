// List all active zones and the reason they are active.
const zones = await Homey.zones.getZones();
for (const zone of Object.values(zones)) {
  if (!zone.active) continue;
  log("=".repeat(5), zone.name);
  for (const origin of zone.activeOrigins) {
    const match = origin.match(/(?<=homey:)([^:]*):([^:]*):*(.*)/);
    if (match[1] === "device") {
      try {
        const device = await Homey.devices.getDevice({ id: match[2] });
        log("Device:", device.name, "|", match[3]);
      } catch (e) {
        log(e);
      }
    } else if (match[1] === "zone") {
      try {
        const originZone = await Homey.zones.getZone({ id: match[2] });
        log("Zone:", originZone.name);
      } catch (e) {
        log(e);
      }
    }
  }
  log(" ");
}

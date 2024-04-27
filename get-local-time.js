/*
  Gets the time in the local timezone
*/

let sys = await Homey.system.getInfo();
let time = new Date().toLocaleString(sys.country, {
timeZone: sys.timezone,
hour: '2-digit',
minute: '2-digit'
});

return time;

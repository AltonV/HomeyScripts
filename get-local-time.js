/*
  Gets the time in the local timezone and format
*/

const sys = await Homey.system.getInfo();

// Local date
const date = new Date().toLocaleDateString(sys.language + "-" + sys.country, { timeZone: sys.timezone });
log(date)

// Local date and time
const datetime = new Date().toLocaleString(sys.language + "-" + sys.country, { timeZone: sys.timezone });
log(datetime)

// Local time
const time1 = new Date().toLocaleTimeString(sys.language + "-" + sys.country, { timeZone: sys.timezone });
log(time1)

// Local time with more options
// More options here https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat
const time2 = new Date().toLocaleString(sys.country, {
  timeZone: sys.timezone,
  hour: '2-digit',
  minute: '2-digit'
});
log(time2);

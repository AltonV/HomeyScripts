/*
  Pollen forecast for Sweden.
  It creates tags for the level of each type of pollen and a text forecast.

  Argument:
    Choose which region you want forecasts for by specifying it as an argument for the script.

    As of writing this the following is supported.
    Borlänge, Bräkne-Hoby, Eskilstuna, Forshaga, Gävle, Hässleholm, Jönköping, Kiruna, Kristianstad, Ljusdal, Malmö, Norrköping, Nässjö, Piteå, Skövde, Sundsvall, Sverige, Umeå, Visby, Västervik, Östersund, Stockholm, Göteborg.

    If you run the script without an argument it will list all supported regions
*/

let res = await fetch("https://api.pollenrapporten.se/v1/regions");
if (!res.ok) {
  throw new Error(res.statusText);
}

const regions = await res.json();
const region = regions.items.find((r) => r.name === args[0]);
if (region === undefined) {
  throw new Error("Argument need to be one of the following: \n" + regions.items.map(a => a.name).join(", "));
}

res = await fetch("https://api.pollenrapporten.se/v1/pollen-types");
if (!res.ok) {
  throw new Error(res.statusText);
}

const pollenTypes = (await res.json()).items.reduce((result, { id, name }) => {
  result[id] = name;
  return result;
}, {});

res = await fetch(`https://api.pollenrapporten.se/v1/forecasts?region_id=${region.id}&current=true`);
if (!res.ok) {
  throw new Error(res.statusText);
}

const forecast = (await res.json()).items[0];
const forecastText = forecast.text;

await tag("Pollenprognos", forecastText);

for (let pollen of forecast.levelSeries) {
  await tag("Pollennivå " + pollenTypes[pollen.pollenId], pollen.level);
}

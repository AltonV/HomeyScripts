# HomeyScripts

## get-non-reporting-devices.js

A homeyscript that checks for devices that haven't reported any values in a set number of hours.\
You can specify individial thresholds depending on type of value, e.g. temperature, luminance, onoff, battery, etc.

In the variables at the top of the script, you can specify device classes, whole apps and names to ignore.

<img alt="Example flow for the get-non-reporting-devices.js script" height="450" src="https://github.com/AltonV/HomeyScripts/blob/main/pictures/get-non-reporting-devices-example-flow.png" />

## is-any-light-on.js
Returns true/false depending on whether any light (or device set to light) is on or off.\
You can specify which zones to check by providing them with an argument and separating them with |

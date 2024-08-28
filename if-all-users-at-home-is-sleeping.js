/*
  Returns true if all users at home are sleeping, or if at least a specified number of them are.
  If no one is home, it returns false.

  Argument:
    How many people needs to be at home and sleeping for the script to return true.
    If 0 or no argument is provided, all users who are at home must be sleeping.

  Variables:
    ignoreDisabledUsers: Set to false to inlude disabled users.

*/

const ignoreDisabledUsers = true;


const users = await Homey.users.getUsers();
let homeSleep = 0;
let homeAwake = 0;

for (const user of Object.values(users)) {
  if (!user.present || ignoreDisabledUsers && !user.enabled) continue;
  if (user.asleep) {
    homeSleep++
  } else {
    homeAwake++
  }
}

log("Home and awake:    " + homeAwake);
log("Home and sleeping: " + homeSleep);

const number = parseInt(args[0]) || 0;

return (homeAwake == 0 && homeSleep > 0) || (number > 0 && number >= homeSleep);

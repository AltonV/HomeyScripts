// This script disables all flows

// Regular flows
for (const flow of Object.values(await Homey.flow.getFlows())) {
  flow.enabled = false;
  await Homey.flow.updateFlow({ id: flow.id, flow: flow });
}

// Advanced flows
for (const flow of Object.values(await Homey.flow.getAdvancedFlows())) {
  flow.enabled = false;
  await Homey.flow.updateAdvancedFlow({ id: flow.id, advancedflow: flow });
}

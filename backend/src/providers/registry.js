import { RemoteOKProvider } from "./RemoteOKProvider.js";
import { WeWorkRemotelyProvider } from "./WeWorkRemotelyProvider.js";
import { GetOnBrdProvider } from "./GetOnBrdProvider.js";
import { ComputrabajoProvider } from "./ComputrabajoProvider.js";

const providers = [
  new RemoteOKProvider(),
  new WeWorkRemotelyProvider(),
  new GetOnBrdProvider(),
  new ComputrabajoProvider(),
];

export const providerRegistry = {
  getAll: () => providers,
  getByName: (name) => providers.find((p) => p.name === name),
  getNames: () => providers.map((p) => ({ name: p.name, displayName: p.displayName })),
};

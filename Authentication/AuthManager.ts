import { AuthFactory } from "./AuthFactory.ts";
import { GoogleAuthStrategy } from "./GoogleAuthStrategy.ts";
import LocalAuthStrategy from "./LocalAuthStrategy.ts";

const googleAuthStrategy    = new GoogleAuthStrategy();
const localAuthStrategy     = new LocalAuthStrategy();
export const authFactory = new AuthFactory([googleAuthStrategy, localAuthStrategy]);
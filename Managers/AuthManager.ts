import { AuthFactory } from "../Authentication/AuthFactory.ts";
import { GoogleAuthStrategy } from "../Authentication/GoogleAuthStrategy.ts";
import LocalAuthStrategy from "../Authentication/LocalAuthStrategy.ts";

const googleAuthStrategy    = new GoogleAuthStrategy();
const localAuthStrategy     = new LocalAuthStrategy();
export const authFactory = new AuthFactory([googleAuthStrategy, localAuthStrategy]);
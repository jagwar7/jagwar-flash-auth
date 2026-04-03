import { AuthFactory } from "./AuthFactory";
import { GoogleAuthStrategy } from "./GoogleAuthStrategy";

const googleAuthStrategy = new GoogleAuthStrategy();

export const authFactory = new AuthFactory([googleAuthStrategy]);
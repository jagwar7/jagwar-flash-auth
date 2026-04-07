import { AuthType } from "../utils/AuthType.ts";



export interface IUserData{
    id: string,
    email: string,
    name: string,
    authType: AuthType,
}
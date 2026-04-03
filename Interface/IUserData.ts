import { AuthType } from "../utils/AuthType";



export interface IUserData{
    id: string,
    email: string,
    name: string,
    authType: AuthType,
}
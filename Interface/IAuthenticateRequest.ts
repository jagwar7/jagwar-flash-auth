import { IUserData } from "./IUserData.ts";
import { Request } from "express";

export interface IAuthenticateRequest extends Request{
    user?: IUserData;
}
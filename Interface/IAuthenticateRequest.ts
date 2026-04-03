import { IUserData } from "./IUserData";
import { Request } from "express";

export interface IAuthenticateRequest extends Request{
    user?: IUserData;
}
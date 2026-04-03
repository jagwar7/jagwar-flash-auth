import { Request, Response } from "express";
import { AuthType } from "../utils/AuthType";

export interface AuthStrategy{
    getAuthType():AuthType;
    signup(req: Request, res: Response): Promise<any>;
    signin(req: Request, res: Response): Promise<any>;
}
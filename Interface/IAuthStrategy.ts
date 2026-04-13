import { Request, Response } from "express";
import { AuthType } from "../utils/AuthType.ts";
import { ResponseData } from "../utils/ResponseData.ts";

export default interface IAuthStrategy{
    getAuthType():AuthType;
    signup(req: Request, res: Response): Promise<ResponseData>;
    signin(req: Request, res: Response): Promise<ResponseData>;
}
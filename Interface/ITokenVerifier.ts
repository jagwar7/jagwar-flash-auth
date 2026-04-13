import { NextFunction, Request, Response } from "express";
import { IAuthenticateRequest } from "./IAuthenticateRequest.ts";


export interface ITokenVerifier{
    VerifyToken(req: IAuthenticateRequest, res: Response, token:String, next:NextFunction ): Promise<any>
}
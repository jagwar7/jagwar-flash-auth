import { AuthType } from "./AuthType.ts";


export default class UserData {
    public id          : string;
    public name        : string;
    public email       : string;
    public authType    : AuthType

    constructor(id: string, name: string, email: string, authType: AuthType){
        this.id         = id;
        this.name       = name;
        this.email      = email;
        this.authType   = authType; 
    }

}
import { AuthStrategy } from "../Interface/IAuthStrategy.ts";    
import { AuthType } from "../utils/AuthType.ts";


export class AuthFactory{
    public readonly authMap = new Map<AuthType, AuthStrategy>();

    public constructor(authStrategyList: Array<AuthStrategy>){
        this.PopulateAuthMap(authStrategyList);
    }

    private PopulateAuthMap=(authStrategyList: Array<AuthStrategy>):void=>{
        authStrategyList.forEach((strategy)=>{
            this.authMap.set(strategy.getAuthType(), strategy);
        });
    }

    public getStrategy(type: AuthType): AuthStrategy{
        return this.authMap.get(type);
    }
}
import IAuthStrategy from "../Interface/IAuthStrategy.ts";    
import { AuthType } from "../utils/AuthType.ts";


export class AuthFactory{
    public readonly authMap = new Map<AuthType, IAuthStrategy>();

    public constructor(authStrategyList: Array<IAuthStrategy>){
        this.PopulateAuthMap(authStrategyList);
    }

    private PopulateAuthMap=(authStrategyList: Array<IAuthStrategy>):void=>{
        authStrategyList.forEach((strategy)=>{
            this.authMap.set(strategy.getAuthType(), strategy);
        });
    }

    public getStrategy(type: AuthType): IAuthStrategy{
        return this.authMap.get(type);
    }
}
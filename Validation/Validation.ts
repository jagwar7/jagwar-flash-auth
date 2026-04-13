import validator from 'validator';

export default class Validation{

    private constructor(){}

    public static ValidateEmail(email:string): boolean{
        return validator.isEmail(email);
    }

    public static ValidatePassword(password:string):boolean{
        return validator.isStrongPassword(password, {
            minLength: 6,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1,
        });
    }

    public static ValidateName(name:string):boolean{
        return validator.isAlpha(name) && name.length >= 3;
    }
}
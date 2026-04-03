export class ResponseData{
    public success: Boolean;
    public data: any;
    public message: String;
    public status: number;

    constructor(success: Boolean, data: any, message: any, status: number){
        this.success = success;
        this.data = data;
        this.message = message;
        this.status = status;
    }
}
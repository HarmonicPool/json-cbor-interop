import BaseJsonCborError from "../BaseJsonCborError";

export default class JsonCborError extends BaseJsonCborError
{
    constructor( msg: string )
    {
        super( msg );
    }
}
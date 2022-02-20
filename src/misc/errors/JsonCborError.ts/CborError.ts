import JsonCborError from ".";

export default class CborError extends JsonCborError
{
    constructor( msg: string )
    {
        super( msg );
    }
}
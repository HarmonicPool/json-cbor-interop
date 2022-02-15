import JsonCborError from ".";

export default class JsonCborTxError extends JsonCborError
{
    constructor( msg: string )
    {
        super( msg );
    }
}
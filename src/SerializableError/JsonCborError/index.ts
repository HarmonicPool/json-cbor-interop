import SerializableError from "..";

export default class JsonCborError extends SerializableError
{
    constructor( msg: string )
    {
        super( msg );
    }
}
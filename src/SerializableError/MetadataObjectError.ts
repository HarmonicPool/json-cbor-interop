import SerializableError from ".";

export default class MetadataObjectError extends SerializableError
{
    constructor( msg: string )
    {
        super( msg );
    }
}
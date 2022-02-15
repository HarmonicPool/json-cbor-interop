
export default class CborError extends Error
{
    constructor( msg: string )
    {
        super( msg );
    }
}
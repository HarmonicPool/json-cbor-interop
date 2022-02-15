
export default class BaseJsonCborError extends Error
{
    constructor( msg: string )
    {
        super( msg );
    }
}
import TypesError from ".";

export default class HexError extends TypesError
{
    constructor( msg: string )
    {
        super( msg );
    }
}
import TypesError from ".";


export default class UInt64Error extends TypesError
{
    constructor( msg: string )
    {
        super( msg );
    }
}
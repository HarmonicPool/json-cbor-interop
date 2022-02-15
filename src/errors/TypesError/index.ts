import BaseJsonCborError from "../BaseJsonCborError";


export default class TypesError extends BaseJsonCborError
{
    constructor( msg: string )
    {
        super( msg );
    }
}
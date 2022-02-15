import BaseOffchainError from "../../errors/BaseOffchainError";

export default class SerializableError extends BaseOffchainError
{
    constructor( msg: string )
    {
        super( msg );
    }
}
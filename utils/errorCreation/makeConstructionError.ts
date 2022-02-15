import BaseOffchainError from "../../errors/BaseOffchainError";

export default function makeConstructionError< ErrorType extends BaseOffchainError = BaseOffchainError >
( 
    constructorName: string,
    schema: string,
    input: object
)
{
    return new BaseOffchainError(
        "tring to construct a " + constructorName + " instance with a non valid object; object should follow the schema \"" + schema + "\", instead was: " + JSON.stringify( input )
    ) as ErrorType;
}
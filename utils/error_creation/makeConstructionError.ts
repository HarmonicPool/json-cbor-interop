import BaseJsonCborError from "../../src/errors/BaseJsonCborError";

export default function makeConstructionError< ErrorType extends BaseJsonCborError = BaseJsonCborError >
( 
    constructorName: string,
    schema: string,
    input: object
)
{
    return new BaseJsonCborError(
        "tring to construct a " + constructorName + " instance with a non valid object; object should follow the schema \"" + schema + "\", instead was: " + JSON.stringify( input )
    ) as ErrorType;
}
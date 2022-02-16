import BaseJsonCborError from "../../src/errors/BaseJsonCborError";

export default function shouldNeverGetHereError< ErrorType extends BaseJsonCborError = BaseJsonCborError >( methodName : string ) : ErrorType
{
    return new BaseJsonCborError(
        "unexpected flow execution, in method " + methodName +"; please open an issue if this error raised"
    ) as ErrorType;
}

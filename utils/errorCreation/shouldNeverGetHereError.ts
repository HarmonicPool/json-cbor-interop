import BaseOffchainError from "../../errors/BaseOffchainError";

export default function shouldNeverGetHereError< ErrorType extends BaseOffchainError = BaseOffchainError >( methodName : string ) : ErrorType
{
    return new BaseOffchainError("unexpected flow execution, in method " + methodName +"; please open an issue if this error raised") as ErrorType;
}

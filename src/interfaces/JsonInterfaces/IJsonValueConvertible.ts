import RawJsonValue from "./RawJsonValue";

export default interface IJsonValueConvertible
{
    toJsonValue: () => RawJsonValue
}

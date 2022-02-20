import RawJsonValue from "./RawJsonValue";

export default interface IJsonValueOverwritable
{
    overwriteFromJsonValue: ( obj: RawJsonValue ) => void
}
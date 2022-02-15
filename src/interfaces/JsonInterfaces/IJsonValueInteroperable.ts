import IJsonValueConvertible from "./IJsonValueConvertible";
import IJsonValueOverwritable from "./IJsonValueOverwritable";

export default interface IJsonValueInteroperable
    extends IJsonValueConvertible, IJsonValueOverwritable
{
    // implements both
}
import CborString from "../../types/HexString/CborString";

export default interface ICborConvertible
{
    toCbor: () => CborString
}
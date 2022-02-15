import CborString from "../../types/HexString/CborString";

export default interface ICborOverwritable
{
    overwriteFromCbor: ( cbor: CborString ) => void
}
import HexString from "..";
import Cbor from "../../../Cbor";
import JsonCbor from "../../../JsonCbor";

export default
class CborString
    extends HexString
{
    constructor( cbor: string )
    {
        cbor = cbor.split(" ").join("");
        cbor = (cbor.length % 2) ? "0" + cbor : cbor;

        super( cbor );
    }

    static fromJsonCbor( jsonCbor : JsonCbor ): CborString
    {
        return Cbor.fromJsonCbor( jsonCbor );
    }
}
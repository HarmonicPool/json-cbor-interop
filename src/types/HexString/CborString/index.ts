import HexString from "..";

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
}
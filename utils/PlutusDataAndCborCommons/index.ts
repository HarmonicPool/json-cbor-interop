import HexString from "../Hex/HexString";
import ObjectUtils from "../ObjectUtils";

/**
 * util static class that limits code rendoundacies
 * since PlutusData is morally an extension of JsonCbor with some limitations,
 * 
 * in this class will be grouped the shared methods
 */
export default class PlutusDataAndCborCommons
{
    private constructor() {};

    /*
    // Strings are not supported In PlutsData
    // Construcors (PlutusData) are not supported (at least intrinsically) by Cbors
    // Map and Lists must recoursively check, so these can't be shared
    */

    static Int = {

        isValid: ( obj: { int: number | BigInt } ): boolean =>
        {
            return (
                ObjectUtils.isObject( obj ) &&
                ObjectUtils.hasUniqueKey( obj, "int" ) &&
                PlutusDataAndCborCommons.Int.isValidValue( obj["int"] )
            );
        },

        isValidValue: ( any: number | BigInt ): boolean =>
        {
            if( typeof any === "bigint" ) return true;
            if( typeof any !== "number" ) return false;
    
            return (
                Math.round( any ) === any
            );
        }
    };

    static Bytes = {

        isValid:( obj: object ): boolean =>
        {
            return (
                ObjectUtils.isObject( obj ) &&
                ObjectUtils.hasUniqueKey( obj, "bytes" ) &&
                PlutusDataAndCborCommons.Bytes.isValidValue( obj["bytes"] )
            )
        },

        isValidValue: ( bytes: string | Buffer ): boolean =>
        {
            if( Buffer.isBuffer( bytes ) ) return true;
    
            if( typeof bytes !== "string" ) return false;
    
            return(
                HexString.isHex( bytes ) ||
                (HexString.isHex( bytes.slice(2) ) && bytes.slice( 0, 2 ) == "0x" )
            )
        }
    };
}
import { Buffer } from "buffer";
import HexError from "../../misc/errors/TypesError/HexError";

export default class HexString
{
    private _hex: string;

    protected set hex( hexString: string )
    {
        this._hex = hexString.toLowerCase();
    }

    constructor( hexString : string )
    {
        hexString = hexString.split(" ").join("").toLowerCase();
        HexString._assertHex( hexString );

        this._hex = hexString.toLowerCase();
    }

    get asString(): string
    {
        return this._hex;
    }

    get asBytes(): Buffer
    {
        return Buffer.from( this._hex, "hex" );
    }

    /**
     * 
     * @param anyString assumed hex string
     * @returns true if the string can be interpreted as hexadecimal value
     */
    public static isHex( anyString: string ): boolean
    {
        const str = anyString.toLowerCase();
        const validHex = "987654321abcdef0";

        for( let i = 0; i < str.length; i++)
        {
            if( !validHex.includes(str[i]) ) return false;
        }

        // if false has not been returned yet, then it must be a valid hex
        return true;
    }

    private static _assertHex( str: string ) : void
    {
        if( !HexString.isHex( str ) ) throw new HexError("provided string is expected to be a valid hex value; inpur was: " + str);
    }

    public static fromAscii( asciiStr: string ): HexString
    {
        return new HexString( Buffer.from(asciiStr, "ascii").toString("hex") );
    }

    public static toAscii( hexStr: HexString ): string
    {
        return hexStr.asBytes.toString("ascii")
    }

    public static formBytes( buffer: Buffer ): HexString
    {
        return new HexString( ( buffer.toString("hex") ) )
    }
    
}
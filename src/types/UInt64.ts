import { Buffer } from "buffer";

export default
class UInt64
{
    private _bytes: Buffer;

    constructor( bytes : Buffer )
    {
        if( bytes.length !== 8 ) throw Error("can't construct an Uint64 with less or more than 8 bytes");

        this._bytes = bytes;
    }

    static fromBytes( bytes: Buffer, offset: number = 0 )
    {
        if( bytes.length < offset + 8 ) throw Error("can't construct an Uint64 with less than 8 bytes");

        return new UInt64(
            Buffer.from( // copies rather than referencing
                bytes.slice( offset, offset + 8 )
            )
        );
    }

    static fromBigInt( bigInt: BigInt )
    {
        let hexBytes = bigInt.toString(16);

        while( hexBytes.length < 16 )
        {
            hexBytes = "0" + hexBytes;
        }

        return new UInt64(
            Buffer.from( hexBytes , "hex" )
        );
    }

    static is_uint32( uint64: UInt64 ): boolean
    {
        return ( uint64.to_bigint() <= BigInt( 0xffffffff ) )
    }

    to_bytes(): Buffer
    {
        return this._bytes;
    }
    
    to_bigint(): bigint
    {
        return (
            BigInt( this._bytes.readUInt32BE() ) << BigInt( 32 ) |
            BigInt( this._bytes.readUInt32BE( 4 ) )
        )
    }

    unsafe_to_uint64() : number
    {
        return Number( this.to_bigint() );
    }

    to_sumOfUint32_array(): number[]
    {
        let res: number[] = [];

        const maxI32 = 0xffffffff;
        let thisBigInt = this.to_bigint();

        while( thisBigInt > thisBigInt )
        {
            res.push( maxI32 );

            thisBigInt = thisBigInt - BigInt( maxI32 );
        }

        return res;
    }

    to_uint32(): number
    {
        return this._bytes.readUInt32BE( 4 );
    }

    to_uint16(): number
    {
        return this._bytes.readUInt32BE( 6 );
    }
}
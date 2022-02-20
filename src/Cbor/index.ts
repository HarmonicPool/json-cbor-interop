import BufferUtils from "../../utils/BufferUtils";
import CborError from "../misc/errors/JsonCborError.ts/CborError";
import JsonCbor, { JsonCborBytes, JsonCborInt, JsonCborKey, JsonCborList, JsonCborString, JsonCbor_float_or_simple, RawJsonCborBytes, RawJsonCborFloat, RawJsonCborInt, RawJsonCborList, RawJsonCborMap, RawJsonCborString, RawJsonCborTag, RawJsonCborValue } from "../JsonCbor";
import UInt64 from "../types/UInt64";
import CborString from "../types/HexString/CborString";
import CborConstants, { AdditionalInformation, MajorType, MajorTypeAsUint8, Tag_addInfos } from "./Constants";
import ObjectUtils from "../../utils/ObjectUtils";
import shouldNeverGetHereError from "../../utils/error_creation/shouldNeverGetHereError";

export interface TagHandlerInfos
{
    /**
     * if ```true``` an object respecting the ```RawJsonCborTag```
     * ```ts
     * {
     *  tag: number,
     *  data: RawJsonCborValue
     * }
     * ```
     *  is pushed
     * 
     * if ```false``` only the ```data``` is pushed
     */
    shouldKeepTag: boolean
    /**
     * if ```true``` keeps processing as normaly
     * if ```false``` Cbor.parse throws an error and the process is stopped
     */
    isValidData: boolean,
}
export interface CborParseOptions
{
    tagHandler: ( rawTag: RawJsonCborTag ) => TagHandlerInfos
}

export const defaultParseOptions: Readonly<CborParseOptions> = Object.freeze({
    /**
     * implementation that follows the rfc7049 CBOR specification for tags parsing:
     * https://datatracker.ietf.org/doc/html/rfc7049#section-2.4
     * 
     * @param {RawJsonCborTag} parsed_tag result of tag parsing from the CBOR bytes
     * @returns {TagHandlerInfos} having 
     *      - ```shouldKeepTag``` setted to ```true``` if it is a [the rfc7049 CBOR specification ](https://datatracker.ietf.org/doc/html/rfc7049#section-2.4) defined tag,```false``` otherwhise
     *      - ```isValidData``` according to [the rfc7049 CBOR specification ](https://datatracker.ietf.org/doc/html/rfc7049#section-2.4) if the tag is defined, defaults to ```true``` (ignoring the tag) if the tag itself is not defined
     */
    tagHandler: ( { tag, data }: RawJsonCborTag ): TagHandlerInfos => {

        const tag_addInfos = Cbor.Constants.AddInfos.Tag;
        switch( tag )
        {
            case tag_addInfos.utf8_string       : // 0
                return {
                    shouldKeepTag: true,
                    isValidData: JsonCborString.isValid( data as RawJsonCborString )
                };
            break;
            case tag_addInfos.epoch_datetime    : // 1
                return {
                    shouldKeepTag: true,
                    isValidData: JsonCborInt.isValid( data as RawJsonCborInt ) || JsonCbor_float_or_simple.isFloat( data as RawJsonCborFloat )
                };
            break;
            case tag_addInfos.positive_bignum   : // 2
                return {
                    shouldKeepTag: true,
                    isValidData: JsonCborBytes.isValid( data as RawJsonCborBytes )
                };
            break;
            case tag_addInfos.negative_bignum   : // 3
                return {
                    shouldKeepTag: true,
                    isValidData: JsonCborBytes.isValid( data as RawJsonCborBytes )
                };
            break;
            case tag_addInfos.decimal_frac_array: // 4
                const _list = ( data as RawJsonCborList ).list as RawJsonCborInt[];
                return {
                    shouldKeepTag: true,
                    isValidData: (
                        JsonCborList.isValid( data as RawJsonCborList ) &&
                        _list.length === 2   &&
                        JsonCborInt.isValid( _list[0] ) && JsonCborInt.isValid( _list[1] )
                    )
                };
            break;
            case tag_addInfos.bigfloat          :
                const list = ( data as RawJsonCborList ).list as RawJsonCborInt[];
                return {
                    shouldKeepTag: true,
                    isValidData: (
                        JsonCborList.isValid( data as RawJsonCborList ) &&
                        list.length === 2   &&
                        JsonCborInt.isValid( list[0] ) && JsonCborInt.isValid( list[1] )
                    )
                };
            break;
            /*
            case tag_addInfos.first_unassigned  :
                return {
                    shouldKeepTag: true,
                    isValidData:
                };
            //*/
            break;
            case tag_addInfos.expect_base64_url : // 21
            //    return {
            //        shouldKeepTag: true,
            //        isValidData:
            //    };
            //break;
            case tag_addInfos.expect_base64     : // 22
            //    return {
            //        shouldKeepTag: true,
            //        isValidData:
            //    };
            //break;
            case tag_addInfos.expect_base16     : // 23
            //    return {
            //        shouldKeepTag: true,
            //        isValidData:
            //    };

            /*
                https://datatracker.ietf.org/doc/html/rfc7049#section-2.4.4.2

                The data item tagged can be a byte string or any other data item.  In
                the latter case, the tag applies to all of the byte string data items
                contained in the data item, except for those contained in a nested
                data item tagged with an expected conversion.
             */
                return {
                    shouldKeepTag: true,
                    isValidData: JsonCbor.isValid( data )
                };
            break;
            case tag_addInfos.sub_cbor          : // 24
                return {
                    shouldKeepTag: true,
                    isValidData: JsonCborBytes.isValid( data as RawJsonCborBytes )
                };
            break;
            /*
            case tag_addInfos.second_unassigned :
                return {
                    shouldKeepTag: true,
                    isValidData:
                };
            break;
            //*/
            case tag_addInfos.uri               :
            //    return {
            //        shouldKeepTag: true,
            //        isValidData:
            //    };
            //break;
            case tag_addInfos.base64_url        :
            //    return {
            //        shouldKeepTag: true,
            //        isValidData:
            //    };
            //break;
            case tag_addInfos.base64            :
                return {
                    shouldKeepTag: true,
                    isValidData: JsonCbor.isValid( data )
                };
            break;
            case tag_addInfos.regexp            :
                return {
                    shouldKeepTag: true,
                    isValidData: JsonCborString.isValid( data as RawJsonCborString )
                };
            break;
            case tag_addInfos.MIME              :  // https://datatracker.ietf.org/doc/html/rfc2045
                return {
                    shouldKeepTag: true,
                    isValidData: JsonCbor.isValid( data )
                };
            break;
            case tag_addInfos.self_cbor         :
                return {
                    shouldKeepTag: true,
                    isValidData: JsonCborBytes.isValid( data as RawJsonCborBytes )
                };
            break;

            default:
                return {
                    shouldKeepTag: false, // ignores the tag by default on non standard tags
                    isValidData: JsonCbor.isValid( data )
                };
        }
    }
});

interface SubParsedJson
{
    parsedCbor: string,
    totLength: number | UInt64
}

interface RawMapPair{
    k: RawJsonCborValue,
    v: RawJsonCborValue
}
/**
 * @static
 */
export default class Cbor
{    
    private constructor() { };

    static Constants = CborConstants;

    static getMajorType(n: number): MajorType {
        // xxxx_xxxx xxxx_xxxx xxxx_xxxx xxxx_xxxx
        // &
        // 0000_0000 0000_0000 0000_0000 1110_0000 // 224 // unsigned base 10
        return (
            (n & Cbor.Constants.MajorTypeMask) >> 5
        );
    }

    static getAdditionalInfos(n: number): AdditionalInformation {
        // xxxx_xxxx xxxx_xxxx xxxx_xxxx xxxx_xxxx
        // &
        // 0000_0000 0000_0000 0000_0000 0001_1111 // 31 // unsigned base 10
        return (n & Cbor.Constants.AdditionalInfosMask);
    }

    //TODO floats
    static fromJsonCbor( jsonCbor: JsonCbor | RawJsonCborValue ): CborString
    {
        const rawJson = jsonCbor instanceof JsonCbor ? jsonCbor.toRawObject() : jsonCbor;

        // if tag json_cbor
        if( ObjectUtils.has_n_determined_keys( rawJson, 2, "tag", "data" ) )
        {
            const { tag, data } = (rawJson as RawJsonCborTag);

            const tagBuff = Buffer.from( Cbor.fromJsonCbor({ int: tag }).asBytes );
            tagBuff.writeUInt8( // just change the majortype
                MajorTypeAsUint8.tag | Cbor.getAdditionalInfos( tagBuff.readUInt8(0) ) ,
                0 // offset 0, first byte
            )

            return new CborString( tagBuff.toString("hex") + Cbor.fromJsonCbor( data ).asString );
        }

        if( !ObjectUtils.hasUniqueKey( rawJson ) )
        {
            throw shouldNeverGetHereError<CborError>( "Cbor.fromJsonCbor" );
        }

        switch( Object.keys( rawJson )[0] as JsonCborKey )
        {
            case "bytes":
                return Cbor._fromJsonCbor_handleHeader(
                    MajorTypeAsUint8.bytes,
                    Cbor._fromJsonCbor_bytes(
                        rawJson as RawJsonCborBytes
                    )
                );
            break;
            case "int":
                // numbers maight be contained in the header itself
                // Cbor._fromJsonCbor_int act as amodified version of Cbor._fromJsonCbor_handleHeader

                // handles both unsigned and negative cases
                // TEST test totest toTest @test negative case (- negative + 1)
                return Cbor._fromJsonCbor_int(
                    rawJson as RawJsonCborInt
                );
            break;
            case "string":
                return Cbor._fromJsonCbor_handleHeader(
                    MajorTypeAsUint8.text,
                    Cbor._fromJsonCbor_string(
                        rawJson as RawJsonCborString
                    )
                );
            break;
            case "list":
                return Cbor._fromJsonCbor_handleHeader(
                    MajorTypeAsUint8.array,
                    Cbor._fromJsonCbor_list(
                        rawJson as RawJsonCborList
                    )
                );
            break;
            case "map":
                return Cbor._fromJsonCbor_handleHeader(
                    MajorTypeAsUint8.map,
                    Cbor._fromJsonCbor_map(
                        rawJson as RawJsonCborMap
                    )
                );
            break;
            case "tag":
            case "data":
                throw new CborError("trying to creat Cbor form JsonCbor using an invalid tag instance,"+
                "\nraw instance should respect the schema : \"{ tag: number, dat: RawJsonCborValue },\""+
                "\ninstead was: "+JSON.stringify( rawJson ) )
            default:
                throw shouldNeverGetHereError<CborError>( "Cbor.fromJsonCbor" );
        }
    }

    static _fromJsonCbor_handleHeader( major_t: MajorTypeAsUint8, subParsed: SubParsedJson ): CborString
    {
        const addInfo_consts = Cbor.Constants.AddInfos.Bytes;

        const header = Buffer.alloc(9);
        let headerStr: string = "";

        const getHeaderStr = ( headerLen: number ): string =>
        {
            return BufferUtils.copy(
                header.subarray(0,headerLen)
            ).toString("hex");
        }

        if( typeof subParsed.totLength === "number" )
        {
            if( subParsed.totLength <= 23 )
            {
                header.writeUint8( major_t | subParsed.totLength , 0 );

                headerStr = getHeaderStr( 1 );
            }
            else if( subParsed.totLength <= 0xff )
            {
                header.writeUInt8( major_t | addInfo_consts.expect_uint8_length, 0 );
                header.writeUInt8( subParsed.totLength , 1 );

                headerStr = getHeaderStr( 1 + 1 );
            }
            else if( subParsed.totLength <= 0xffff )
            {
                header.writeUInt8( major_t | addInfo_consts.expect_uint16_length, 0 );
                header.writeUInt16BE( subParsed.totLength , 1 );

                headerStr = getHeaderStr( 1 + 2 );
            }
            else if( subParsed.totLength <= 0xffffffff )
            {
                header.writeUInt8( major_t | addInfo_consts.expect_uint32_length, 0 );
                header.writeUInt32BE( subParsed.totLength , 1 );

                headerStr = getHeaderStr( 1 + 4 );
            }

            return new CborString(
                headerStr + subParsed.parsedCbor
            );
        }

        header.writeUInt8( major_t | addInfo_consts.expect_uint64_length, 0 );
        header.writeBigInt64BE( subParsed.totLength.to_bigint(), 1 );

        headerStr = getHeaderStr( 1 + 8 );

        return new CborString(
            headerStr + subParsed.parsedCbor
        );
    }

    static _fromJsonCbor_bytes( bytesObj : RawJsonCborBytes ): SubParsedJson
    {
        if( bytesObj.bytes.length % 2 )
        {
            throw new CborError(
                "unexpected bytesring length while parsing a JsonCbor to Cbor, length was: "+ 
                bytesObj.bytes.length + " and it should be even in order to construct bytes"
            );
        }

        return {
            parsedCbor: bytesObj.bytes,
            totLength: bytesObj.bytes.length / 2
        }
    }

    static _fromJsonCbor_int( { int }: RawJsonCborInt ): CborString
    {
        const addInfo_consts = Cbor.Constants.AddInfos.Negative;

        if(
            int instanceof UInt64 && !int.is_uint32()
        )
        {
            const buff = Buffer.alloc(9);
            
            buff.writeUInt8( 
                ( int.isNegative ? MajorTypeAsUint8.negative : MajorTypeAsUint8.unsigned )
                | addInfo_consts.expect_uint64
            );

            // overwrites the first too,not good
            int.writeToBuffer( buff, 1 );

            return new CborString( buff.toString("hex") );
        }
        else if( int instanceof UInt64 && int.is_uint32() )
        {
            int = int.to_int32();
        }

        // if positive stays positive, if negative takes the complementar
        // ... as in real life, be positive guys
        const unsigned_num = (int as number) >= 0 ? (int  as number) : ( -(int  as number) ) - 1 ;

        if( unsigned_num <= 23 )
        {
            const buff = Buffer.alloc(1)
            
            buff.writeUInt8(
                int >= 0 ?
                MajorTypeAsUint8.unsigned | unsigned_num :
                MajorTypeAsUint8.negative | unsigned_num
            )
            
            return new CborString( buff.toString("hex") );
        }
        else if( unsigned_num <= 0xff )
        {
            const buff = Buffer.alloc( 1 + 1 );
            buff.writeUInt8( 
                unsigned_num >= 0 ?
                MajorTypeAsUint8.unsigned | addInfo_consts.expect_uint8 :
                MajorTypeAsUint8.negative | addInfo_consts.expect_uint8
            );
            buff.writeUInt8( unsigned_num , 1 );

            return new CborString( buff.toString("hex") )
        }
        else if( unsigned_num <= 0xffff )
        {
            const buff = Buffer.alloc(1 + 2);
            buff.writeUInt8( 
                unsigned_num >= 0 ?
                MajorTypeAsUint8.unsigned | addInfo_consts.expect_uint16 :
                MajorTypeAsUint8.negative | addInfo_consts.expect_uint16
            );
            buff.writeUInt16BE( unsigned_num , 1 );

            return new CborString( buff.toString("hex") )
        }
        else if( unsigned_num <= 0xffffffff )
        {
            const buff = Buffer.alloc(1 + 4);
            buff.writeUInt8( 
                unsigned_num >= 0 ?
                MajorTypeAsUint8.unsigned | addInfo_consts.expect_uint32 :
                MajorTypeAsUint8.negative | addInfo_consts.expect_uint32
            );
            buff.writeUInt32BE( unsigned_num , 1 );

            return new CborString( buff.toString("hex") )
        }

        throw new CborError("found unsigned or negative taking more than 32 bit not being 'bigint' or UInt64 instances while parsing JsonCbor to CBOR, thrown in Cbor._fromJsonCbor_int");
    }

    static _fromJsonCbor_string( { string }: RawJsonCborString ): SubParsedJson
    {
        const bytes = Buffer.from( string, "utf8" );
        return {
            parsedCbor: bytes.toString("hex"),
            totLength: bytes.length
        }
    }

    static _fromJsonCbor_list( { list }: RawJsonCborList ): SubParsedJson
    {
        let parsedCbor: string = "";

        for( let i = 0; i < list.length; i++ )
        {
            parsedCbor += Cbor.fromJsonCbor( list[i] ).asString;
        }

        return {
            parsedCbor: parsedCbor,
            totLength: list.length
        }
    }

    static _fromJsonCbor_map( { map }: RawJsonCborMap ): SubParsedJson
    {
        let parsedCbor: string = "";

        for( let i = 0; i < map.length; i++ )
        {
            parsedCbor += Cbor.fromJsonCbor( map[i].k ).asString;
            parsedCbor += Cbor.fromJsonCbor( map[i].v ).asString;
        }

        return {
            parsedCbor: parsedCbor,
            totLength: map.length
        }
    }

    static defaultParseOptions = defaultParseOptions;

    static parse(cbor: CborString | string | Buffer, options?: CborParseOptions): JsonCbor
    {
        if (typeof cbor === "string") {
            cbor = new CborString(cbor);
        }

        const bytes = ((cbor instanceof CborString) ? cbor.asBytes : cbor);

        if (bytes.length === 0) {
            throw new CborError("empty cbor passed");
        }

        // private method allows to pass information using recursion
        const rawParsed = Cbor._parse(
            bytes ,
            Object.freeze({
                ...defaultParseOptions,
                ...options
            }));

        return new JsonCbor( rawParsed.parsed );
    }
    
    private static _parse( bytes: Buffer, options: Readonly<CborParseOptions> )
        : {
            top_level_header: MajorType,
            parsed: RawJsonCborValue,
            msg_len: number,
            headers_tot_len: number,
        }
    {
        //let i = 0;
        //for (let i = 0; i < bytes.length; i++)
        //{
        const header_byte = bytes.readUInt8( 0 );

        const major_t = Cbor.getMajorType(header_byte);
        const addInfos = Cbor.getAdditionalInfos(header_byte);

        switch (major_t)
        {
            case MajorType.unsigned:
                /*
                    https://datatracker.ietf.org/doc/html/rfc7049#section-3.9

                    0 to 23 and -1 to -24 must be expressed in the same byte as the
                    major type
                */
                if (addInfos < Cbor.Constants.AddInfos.Unsigned.expect_uint8) {
                    // discrads the rest if any
                    return {
                        top_level_header: major_t,
                        parsed: { int: addInfos },
                        msg_len: 0,
                        headers_tot_len: 1
                    };
                }

                const unsign = Cbor.Constants.AddInfos.Unsigned;

                switch (addInfos)
                {
                    case unsign.expect_uint8:
                        // takes the next byte and discards the rest if any
                        return {
                            top_level_header: major_t,
                            parsed: { int: bytes.readUInt8( 1 ) },
                            msg_len: 1,
                            headers_tot_len: 1
                        };
                    break;
                    case unsign.expect_uint16:
                        // takes the next 2 bytes and discards the rest if any
                        return {
                            top_level_header: major_t,
                            parsed: { int: bytes.readUInt16BE( 1 ) },
                            msg_len: 2,
                            headers_tot_len: 1
                        };
                    break;
                    case unsign.expect_uint32:
                        // takes the next 4 bytes and discards the rest if any
                        return {
                            top_level_header: major_t,
                            parsed: { int: bytes.readUInt32BE( 1 ) },
                            msg_len: 4,
                            headers_tot_len: 1
                        };
                    break;
                    case unsign.expect_uint64:
                        // takes the next 8 bytes and discards the rest if any
                        return {
                            top_level_header: major_t,
                            parsed: { int: UInt64.fromBytes( bytes, 1 ) },
                            msg_len: 8,
                            headers_tot_len: 1
                        };
                    break;
                    case unsign.unknown:
                    default:
                        throw new CborError("can't handle additional information " + addInfos + " for major type unsigned ( 0b000_xxxxx ) ");
                }

                break;
            case MajorType.negative:
                /*
                    https://datatracker.ietf.org/doc/html/rfc7049#section-3.9

                    0 to 23 and -1 to -24 must be expressed in the same byte as the
                    major type
                */
                if (addInfos <= 23) {
                    return {
                        top_level_header: major_t,
                        parsed: { int: -addInfos - 1 },
                        msg_len: 0,
                        headers_tot_len: 1
                    };
                }

                const neg = Cbor.Constants.AddInfos.Negative;

                switch (addInfos) {
                    case neg.expect_uint8:
                        // takes the next byte and discards the rest if any
                        if( 1 >= bytes.length) throw new CborError("unexpected end of input, need at least one more byte")
                        return {
                            top_level_header: major_t,
                            parsed: { int: - bytes.readUInt8( 1 ) - 1 },
                            msg_len: 1,
                            headers_tot_len: 1
                        };
                    break;
                    case neg.expect_uint16:
                        // takes the next 2 bytes and discards the rest if any
                        return {
                            top_level_header: major_t,
                            parsed: { int: -bytes.readUInt16BE( 1 ) - 1 },
                            msg_len: 2,
                            headers_tot_len: 1
                        };
                    break;
                    case neg.expect_uint32:
                        // takes the next 4 bytes and discards the rest if any
                        return {
                            top_level_header: major_t,
                            parsed: { int: -bytes.readUInt32BE( 1 ) - 1 },
                            msg_len: 4,
                            headers_tot_len: 1
                        };
                    break;
                    case neg.expect_uint64:
                        // takes the next 8 bytes and discards the rest if any

                        // bytes taken "as is" and marked as negative
                        const asNegative = UInt64.fromBytes( bytes, 1 );
                        asNegative.dangerouslySetNegativeFlag( true );

                        return {
                            top_level_header: major_t,
                            parsed: { int: asNegative },
                            msg_len: 8,
                            headers_tot_len: 1
                        };
                    break;
                    case neg.unknown:
                    default:
                        throw new CborError("can't handle additional information " + addInfos + " for major type unsigned ( 0b001_xxxxx ) ");
                }

            break;
            case MajorType.bytes:

                const parsedBytes = Cbor._parseBytes(
                    BufferUtils.copy(
                        bytes.slice( 0 )
                    )
                );

                return {
                    top_level_header: major_t,
                    parsed: { bytes: parsedBytes.bytes },
                    msg_len: parsedBytes.msgLen,
                    headers_tot_len: parsedBytes.headerTotLen
                }

            break;
            case MajorType.text:
                const parsedText = Cbor._parseText(
                    BufferUtils.copy(
                        bytes.slice( 0 )
                    )
                );

                return {
                    top_level_header: major_t,
                    parsed: { string: parsedText.text },
                    msg_len: Number( parsedText.msg_len ),
                    headers_tot_len: parsedText.headers_tot_len
                };
                
            break;
            case MajorType.array:
                const parsedArr = Cbor._parseArr( bytes, options );

                return {
                    top_level_header: major_t,
                    parsed: { list: parsedArr.array },
                    msg_len: parsedArr.msgLen,
                    headers_tot_len: parsedArr.headerTotLen
                }

            break;
            case MajorType.map:

                const parsedMap = Cbor._parseMap(
                    BufferUtils.copy(
                        bytes
                    ),
                    options
                );

                return {
                    top_level_header: major_t,
                    parsed: { map: parsedMap.map },
                    msg_len: parsedMap.msg_len,
                    headers_tot_len: parsedMap.headers_tot_len
                };

            break;
            case MajorType.tag:

                const cpyBuffer = BufferUtils.copy( bytes );
                cpyBuffer.writeUInt8( MajorType.unsigned | addInfos ); // parse as unsigned

                const parsedTagNum = Cbor._parse(
                    cpyBuffer,
                    options
                );

                const parsedData = Cbor._parse(
                    BufferUtils.copy(
                        bytes.subarray(
                            parsedTagNum.msg_len + parsedTagNum.headers_tot_len
                        )
                    ),
                    options
                );

                const rawTag : RawJsonCborTag = { 
                    tag: (parsedTagNum.parsed as RawJsonCborInt).int,
                    data: parsedData.parsed
                };

                const { shouldKeepTag, isValidData } = options.tagHandler( rawTag );

                if( !isValidData ) throw new CborError(
                    `failed parsing a tag value; data did not matched the required type for the tag;`+
                    `\ntag was: ${rawTag.tag};`+
                    `\ndata was: ${JSON.stringify(parsedData.parsed)}`
                );

                const tot_msg_len: number | UInt64 = parsedTagNum.msg_len + parsedData.msg_len;
                const tot_header_tot_len: number = parsedTagNum.headers_tot_len + parsedData.headers_tot_len
                
                if( shouldKeepTag )
                {
                    return {
                        top_level_header: major_t ,
                        parsed: rawTag ,
                        msg_len: tot_msg_len,
                        headers_tot_len: tot_header_tot_len
                    };
                }
                else
                {
                    return {
                        top_level_header: parsedData.top_level_header,
                        parsed: parsedData.parsed,
                        msg_len: tot_msg_len,
                        headers_tot_len: tot_header_tot_len
                    }
                }
            
            break;
            case MajorType.float_or_simple:
                throw new CborError("float parsing not supported at the moment");
            break;

            default: throw new CborError("undefined major type while parsing");
        }

        //}

        throw shouldNeverGetHereError<CborError>("Cbor._parse");
    }


    private static _parseBytes(bytes: Buffer)
        : {
            bytes: string,
            msgLen: number,
            headerTotLen: number
        }
    {
        if (!Buffer.isBuffer(bytes)) throw new CborError("trying to parse bytes with a non Buffer input");

        let byte_ptr: number = 0;
        const headerByte = bytes.readUInt8(byte_ptr);

        // makes sure to work with bytes
        if (Cbor.getMajorType(headerByte) !== MajorType.bytes) {
            throw new CborError("trying to parse a non byte string using the private static method _parseBytes");
        }

        const addInfos = Cbor.getAdditionalInfos(headerByte);

        // the next excludes the case of no bytes following
        if (addInfos === 0) {
            return {
                bytes: "",
                msgLen: 0,
                headerTotLen: 1
            }
        }
        // now we are sure there is a message

        byte_ptr++;
        // now points to the very next byte of the header
        // which is the first byte of the message if addInfos <= 23
        // or the first msgLength byte otherwhise 

        if (addInfos <= 23) {
            // byte_ptr points to the byte message
            return {
                bytes: (
                    BufferUtils.copy(
                        bytes.slice(byte_ptr, byte_ptr + addInfos)
                    ).toString("hex")
                ),
                msgLen: addInfos,
                headerTotLen: 1
            }
        }
        else {

            const _parser_messageHandler : (
                whole_buffer: Buffer,
                fst_byteIndicatingMsgLen_ptr: number,
                nBytesIndicatingMsgLen: 1 | 2 | 4 | 8
            ) => {
                bytes: string,
                msgLen: number ,
                headerTotLen: number
            } = (
                whole_buffer: Buffer,
                fst_byteIndicatingMsgLen_ptr: number,
                nBytesIndicatingMsgLen: 1 | 2 | 4 | 8
            ) => {
                // the length of the actual message
                let msgLen: number = 0;

                // gets the length depending of the addInfos
                switch (nBytesIndicatingMsgLen) {
                    case 1:
                        msgLen = whole_buffer.readUInt8(fst_byteIndicatingMsgLen_ptr);
                        break;
                    case 2:
                        msgLen = whole_buffer.readUint16BE(fst_byteIndicatingMsgLen_ptr);
                        break;
                    case 4:
                        msgLen = whole_buffer.readInt32BE(fst_byteIndicatingMsgLen_ptr);
                        break;
                    case 8:
                        // TODO ToDo todo @todo
                        // BUG Bug bug @bug
                        // BigInt conversion may cause problems here
                        msgLen = Number(
                            whole_buffer.readBigUInt64BE(fst_byteIndicatingMsgLen_ptr)
                        );
                        break;

                    default: throw new CborError(
                        ""
                    );
                }

                // skips the bytes indicating the message length
                const fst_byteMsg_ptr = fst_byteIndicatingMsgLen_ptr + nBytesIndicatingMsgLen;

                return {
                    bytes: (
                        BufferUtils.copy(
                            whole_buffer.slice(
                                fst_byteMsg_ptr,
                                fst_byteMsg_ptr + msgLen
                            )
                        ).toString("hex")
                    ),
                    msgLen: msgLen,
                    headerTotLen: 1 + nBytesIndicatingMsgLen // 1 byte (major_t & addInfos) + 1 byte message length
                }
            }

            const _parser_messageHandler_fixedCase =
                (nBytesIndicatingMsgLen: 1 | 2 | 4 | 8) : {
                    bytes: string,
                    msgLen: number,
                    headerTotLen: number
                } =>
            {
                return _parser_messageHandler(
                    BufferUtils.copy( bytes ),
                    byte_ptr,
                    nBytesIndicatingMsgLen
                )
            };

            const byte_constants = Cbor.Constants.AddInfos.Bytes;

            // byte_ptr points to the first byte indicating the message length
            switch (addInfos)
            {
                case byte_constants.expect_uint8_length:

                    return _parser_messageHandler_fixedCase( 1 );

                break;
                case byte_constants.expect_uint16_length:
                    return _parser_messageHandler_fixedCase( 2 );

                break;
                case byte_constants.expect_uint32_length:
                    return _parser_messageHandler_fixedCase( 4 );

                break;
                case byte_constants.expect_uint64_length:
                    return _parser_messageHandler_fixedCase( 8 );

                break;
                case byte_constants.make_infinite:
                    /*
                    source: https://www.rfc-editor.org/rfc/rfc8949.html#section-3.2.3

                    major type for byte string ( 0b010_xxxxx ) or text string ( 0b011_xxxxx )
                    with an additional information value of 31 ( 0bxxx_11111 )
                    followed by a series of zero or more strings of the specified type ("chunks")
                    that have DEFINITE lengths,
                    */

                    let inf_bytestring: string = "";

                    //neded in case of recoursive infinite bytestring
                    let totHeadersTotLen: number = 0;
                    let totMsgLen: number = 0

                    // QUICK REMINDER
                    // byte_ptr points to the first byte indicating the message length
                    //
                    // since there is no message length for an infinite bytestring
                    // the byte_ptr points to a byteHeader MajorType ( 0b010_xxxxx )

                    // if encounters 0b111_11111 the infinite has ended
                    while ( bytes.readUInt8( byte_ptr ) !== Cbor.Constants.infinite_break)
                    {
                        // at the start of the loop "bytes_ptr" points to the byte header
                        // so it is a single byte

                        if( Cbor.getMajorType( bytes.readUInt8( byte_ptr ) ) !== MajorType.bytes )
                        {
                            throw new CborError(
                                "an element of an unbounded text is not of type byte; at byte no: " +
                                byte_ptr + ", value: " + bytes.readUInt8( byte_ptr ).toString(16)
                            );
                        }

                        const curr_chunk = Cbor._parseBytes(
                            BufferUtils.copy(
                                bytes.slice( byte_ptr )
                            )
                        );

                        inf_bytestring += curr_chunk.bytes;

                        totHeadersTotLen += curr_chunk.headerTotLen;
                        totMsgLen += curr_chunk.msgLen;

                        byte_ptr += curr_chunk.headerTotLen + curr_chunk.msgLen
                    }

                    return {
                        bytes: inf_bytestring,
                        headerTotLen: totHeadersTotLen,
                        msgLen: totMsgLen + 1 // counting the last (break) byte too (0xff)
                    }
                break;

                default: throw new CborError("can't handle additional information " + addInfos + " for major type bytes ( 0b010_xxxxx ) ");
            }
        }
    }

    private static _parseText(bytes: Buffer)
        : {
            text: string,
            msg_len: number | bigint,
            headers_tot_len: number
        }
    {
        if (!Buffer.isBuffer(bytes)) throw new CborError("trying to parse uft8 text with a non Buffer input");

        let byte_ptr: number = 0;
        const headerByte = bytes.readUInt8(byte_ptr);

        // makes sure to work with text
        if (Cbor.getMajorType(headerByte) !== MajorType.text) {
            throw new CborError("trying to parse a non text string using the private static method _parseText");
        }

        const addInfos = Cbor.getAdditionalInfos(headerByte);

        // the next excludes the case of no bytes following
        if (addInfos === 0) {
            return {
                text: "",
                msg_len: 0,
                headers_tot_len: 1
            }
        }
        // now we are sure there is a message

        const _parseText_ofLength_startingFrom
            : (
                length: number | UInt64,
                startingFrom: number                
            )
            => string
        = (
            length: number | UInt64,
            startingFrom: number
        ) => 
        {
            if( length instanceof UInt64 )
            {
                const lengths = length.to_sumOfUint32_array();

                let str: string = "";

                let subBuff = BufferUtils.copy(
                    bytes.subarray( startingFrom )
                );

                for( let i = 0; i < lengths.length; i++ )
                {
                    str += BufferUtils.copy(
                        subBuff.subarray( 0, lengths[i] ) // takes a chunk
                    ).toString("utf8"); // converts to string

                    // cuts away the part red
                    subBuff = BufferUtils.copy(
                        subBuff.subarray( lengths[i] )
                    );
                }

                return str;
            }

            return (
                BufferUtils.copy(
                    bytes.slice( startingFrom, startingFrom + length)
                ).toString("utf8")
            );
        }

        byte_ptr++;
        // now points to the very next byte of the header
        // which is the first byte of the message if addInfos <= 23 or construnction an infinite text
        // or the first msgLength byte otherwhise 

        if (addInfos <= 23) {
            // byte_ptr points to the byte message
            return {
                text: _parseText_ofLength_startingFrom( addInfos, byte_ptr ),
                msg_len: addInfos,
                headers_tot_len: 1
            }
        }

        const txt_consts = Cbor.Constants.AddInfos.Text;
        let strLen : number = 0;

        // byet_ptrpoints to the first msgLength byte
        switch( addInfos )
        {
            case txt_consts.expect_uint8_length:
                strLen = bytes.readUInt8( byte_ptr );

                return {
                    text: _parseText_ofLength_startingFrom( strLen, byte_ptr + 1 ),
                    msg_len: strLen,
                    headers_tot_len: 1 + 1
                }
            break;
            case txt_consts.expect_uint16_length:
                strLen = bytes.readUInt16BE( byte_ptr );

                return {
                    text: _parseText_ofLength_startingFrom( strLen, byte_ptr + 1 ),
                    msg_len: strLen,
                    headers_tot_len: 1 + 2
                }
            break;
            case txt_consts.expect_uint32_length:
                strLen = bytes.readUInt32BE( byte_ptr );

                return {
                    text: _parseText_ofLength_startingFrom( strLen, byte_ptr + 1 ),
                    msg_len: strLen,
                    headers_tot_len: 1 + 4
                }
            break;
            case txt_consts.expect_uint64_length:
                const strLen_big = UInt64.fromBytes(
                    BufferUtils.copy(
                         bytes.subarray( byte_ptr, byte_ptr + 8 )
                    )
                );

                return {
                    text: _parseText_ofLength_startingFrom( strLen_big, byte_ptr + 1 ),
                    msg_len: strLen,
                    headers_tot_len: 1 + 1
                }
            break;
            case txt_consts.make_infinite:
                                    /*
                    source: https://www.rfc-editor.org/rfc/rfc8949.html#section-3.2.3

                    major type for byte string ( 0b010_xxxxx ) or text string ( 0b011_xxxxx )
                    with an additional information value of 31 ( 0bxxx_11111 )
                    followed by a series of zero or more strings of the specified type ("chunks")
                    that have DEFINITE lengths,
                    */

                    let inf_text: string = "";

                    //neded in case of recoursive infinite bytestring
                    let totHeadersTotLen: number = 0;
                    let totMsgLen: number | bigint = 0

                    // QUICK REMINDER
                    // byte_ptr points to the first byte indicating the message length
                    //
                    // since there is no message length for an infinite bytestring
                    // the byte_ptr points to a textHeader MajorType ( 0b011_xxxxx )

                    // if encounters 0b111_11111 the infinite has ended
                    while ( bytes.readUInt8( byte_ptr ) !== Cbor.Constants.infinite_break)
                    {
                        // at the start of the loop "bytes_ptr" points to the byte header
                        // so it is a single byte

                        if( Cbor.getMajorType( bytes.readUInt8( byte_ptr ) ) !== MajorType.text )
                        {
                            throw new CborError(
                                "an element of an unbounded text is not of type text; at byte no: " +
                                byte_ptr + ", value: " + bytes.readUInt8( byte_ptr ).toString(16)
                            );
                        }

                        const curr_chunk = Cbor._parseText(
                            BufferUtils.copy(
                                bytes.slice( byte_ptr )
                            )
                        );

                        inf_text += curr_chunk.text;

                        totHeadersTotLen += curr_chunk.headers_tot_len;
                        totMsgLen += Number( curr_chunk.msg_len );

                        byte_ptr += curr_chunk.headers_tot_len + Number( curr_chunk.msg_len );
                    }

                    return {
                        text: inf_text,
                        headers_tot_len : totHeadersTotLen,
                        msg_len: totMsgLen + 1 // counting the last (break) byte too (0xff)
                    }

                break;

                default:
                    throw new CborError("can't handle additional information " + addInfos + " for major type text ( 0b011_xxxxx ) ");
        }
    }

    private static _parseArr(bytes: Buffer, options: Readonly<CborParseOptions> )
        : {
            array: RawJsonCborValue[],
            msgLen: number,
            headerTotLen: number
        }
    {
        if (!Buffer.isBuffer(bytes)) throw new CborError("trying to parse an array with a non Buffer input");

        let byte_ptr: number = 0;
        const headerByte = bytes.readUInt8(byte_ptr);

        // makes sure to work with an array
        if (Cbor.getMajorType(headerByte) !== MajorType.array) {
            throw new CborError("trying to parse a non array string using the private static method _parseArr");
        }

        const addInfos = Cbor.getAdditionalInfos(headerByte);
        const arr_consts = Cbor.Constants.AddInfos.Array;

        if( addInfos === 0 )
        {
            return {
                array: [],
                msgLen: 0,
                headerTotLen: 1
            };
        }

        const _parseArr_ofLength_startingFrom
            : (
                length: number | bigint,
                startingFrom: number,
                arrHeaderLen: number            
            )
            => {
                array: RawJsonCborValue[],
                msgLen: number,
                headerTotLen: number
            }
        = (
            length: number | bigint,
            startingFrom: number,
            arrHeaderLen: number
        ) => 
        {
            length = BigInt( length );

            const arr: RawJsonCborValue[] = [];

            let totMsgLen: number = 0;
            let totHeadersLen: number = 0

            let elem_ptr = startingFrom;

            for( let i = BigInt( 0 ) ; i < length; i++ )
            {
                const parsed = Cbor._parse(
                    BufferUtils.copy(
                        bytes.slice( elem_ptr )
                    ),
                    options
                )

                arr.push(
                    parsed.parsed
                )

                totHeadersLen += parsed.headers_tot_len;
                totMsgLen += parsed.msg_len;

                // elem_ptr now points to the next header
                elem_ptr += parsed.headers_tot_len + parsed.msg_len;
            }

            return {
                array: arr,
                msgLen: totMsgLen,
                headerTotLen: totHeadersLen + arrHeaderLen
            }
        }

        if( addInfos < arr_consts.expect_uint8_length )
        {
            return _parseArr_ofLength_startingFrom( addInfos, 1 , 1 );
        }

        // QUICK REMINDER
        // byte_ptr is at 0 untill now, pointing to the array header
        // so incrementing it, as we do now,
        // points it to the first length specifier
        // or to the first usefull byte in the case of an infinite array
        byte_ptr++;

        // gets the array length or andles the infinite case
        switch( addInfos )
        {
            case arr_consts.expect_uint8_length:
                return _parseArr_ofLength_startingFrom(
                    bytes.readUInt8( byte_ptr ),
                    byte_ptr + 1,
                    1 + 1
                ) 

            break;
            case arr_consts.expect_uint16_length:
                return _parseArr_ofLength_startingFrom(
                    bytes.readUInt16BE( byte_ptr ),
                    byte_ptr + 2,
                    1 + 2
                );
            break;
            case arr_consts.expect_uint32_length:
                return _parseArr_ofLength_startingFrom(
                    bytes.readUint32BE( byte_ptr ),
                    byte_ptr + 4,
                    1 + 4
                );
            break;
            case arr_consts.expect_uint64_length:
                return _parseArr_ofLength_startingFrom(
                    UInt64.fromBytes( bytes, byte_ptr ).to_bigint(),
                    byte_ptr + 8,
                    1 + 8
                );
            break;
            case arr_consts.make_infinite:
                // byte_ptr pointing the byte after the one of the header

                const arr: RawJsonCborValue[] = [];

                let totMsgLen: number = 0;
                let totHeadersLen: number = 0


                while( bytes.readUInt8( byte_ptr ) !== Cbor.Constants.infinite_break )
                {
                    const parsed = Cbor._parse(
                        BufferUtils.copy(
                            bytes.slice( byte_ptr )
                        ),
                        options
                    )

                    arr.push(
                        parsed.parsed
                    )

                    totHeadersLen += parsed.headers_tot_len;
                    totMsgLen += parsed.msg_len;

                    // byte_ptr now points to the next header
                    byte_ptr += parsed.headers_tot_len + parsed.msg_len;
                }

                return {
                    array: arr,
                    msgLen: totMsgLen + 1 , // counting the last break byte too
                    headerTotLen: totHeadersLen
                }

            break;

            default:
                throw new CborError("can't handle additional information " + addInfos + " for major type array ( 0b100_xxxxx ) ");

        }


    }

    private static _parseMap(bytes: Buffer, options: Readonly<CborParseOptions> )
        : {
            map: RawMapPair[],
            msg_len: number,
            headers_tot_len: number
        }
    {
        if (!Buffer.isBuffer(bytes)) throw new CborError("trying to parse a map with a non Buffer input");

        let byte_ptr: number = 0;
        const headerByte = bytes.readUInt8(byte_ptr);

        // makes sure to work with a map
        if (Cbor.getMajorType(headerByte) !== MajorType.map ) {
            throw new CborError("trying to parse a non map string using the private static method _parseMap");
        }

        const addInfos = Cbor.getAdditionalInfos(headerByte);
        const map_consts = Cbor.Constants.AddInfos.Map;

        if( addInfos === 0 )
        {
            return {
                map: [],
                msg_len: 0,
                headers_tot_len: 1
            };
        }

        /**
         * 
         * @param length specified in the additional info of the very first byte
         * @param startingFrom the first usefull byte of the map value ( the first key to be pased )
         * @returns {RawMapPair[]} JsonCborMap raw value, to be wrapped in { map: rawPardsedValue }
         */
        const _parseMap_ofLength_startingFrom
            : (
                length: number | bigint,
                startingFrom: number                
            )
            => {
                map: RawMapPair[],
                msg_len: number,
                headers_tot_len: number
            }
        = (
            length: number | bigint,
            startingFrom: number
        ) => 
        {
            length = BigInt( length );

            const map: RawMapPair[] = [];

            let totMsgLen: number = 0;
            let totHeadersLen: number = 0

            let elem_ptr = startingFrom;

            for( let i = BigInt( 0 ) ; i < length; i++ )
            {
                
                const parsedKey = Cbor._parse(
                    BufferUtils.copy(
                        bytes.slice( elem_ptr )
                    ),
                    options
                )
                
                totHeadersLen += parsedKey.headers_tot_len;
                totMsgLen += parsedKey.msg_len;

                elem_ptr += parsedKey.headers_tot_len + parsedKey.msg_len;

                const parsedValue = Cbor._parse(
                    BufferUtils.copy(
                        bytes.slice( elem_ptr )
                    ),
                    options
                );

                totHeadersLen += parsedValue.headers_tot_len;
                totMsgLen += parsedValue.msg_len;

                // elem_ptr now points to the next header
                elem_ptr += parsedValue.headers_tot_len + parsedValue.msg_len;

                map.push(
                    {
                        k: parsedKey.parsed,
                        v: parsedValue.parsed
                    }
                );
            }

            return {
                map: map,
                msg_len: totMsgLen,
                headers_tot_len: totHeadersLen
            }
        }

        if( addInfos < map_consts.expect_uint8_length )
        {
            return _parseMap_ofLength_startingFrom( addInfos, 1 );
        }


        // QUICK REMINDER
        // byte_ptr is at 0 untill now, pointing to the array header
        // so incrementing it, as we do now,
        // points it to the first length specifier
        // or to the first usefull byte in the case of an infinite array
        byte_ptr++;

        // gets the array length or andles the infinite case
        switch( addInfos )
        {
            case map_consts.expect_uint8_length:
                return _parseMap_ofLength_startingFrom(
                    bytes.readUInt8( byte_ptr ),
                    byte_ptr + 1
                ) 

            break;
            case map_consts.expect_uint16_length:
                return _parseMap_ofLength_startingFrom(
                    bytes.readUInt16BE( byte_ptr ),
                    byte_ptr + 2
                );
            break;
            case map_consts.expect_uint32_length:
                return _parseMap_ofLength_startingFrom(
                    bytes.readUint32BE( byte_ptr ),
                    byte_ptr + 4
                );
            break;
            case map_consts.expect_uint64_length:
                return _parseMap_ofLength_startingFrom(
                    UInt64.fromBytes( bytes, byte_ptr ).to_bigint(),
                    byte_ptr + 8
                );
            break;
            case map_consts.make_infinite:

                const map: RawMapPair[] = [];

                let totMsgLen: number = 0;
                let totHeadersLen: number = 0

                while( bytes.readUInt8( byte_ptr ) !== Cbor.Constants.infinite_break )
                {
                    const parsedKey = Cbor._parse(
                        BufferUtils.copy(
                            bytes.slice( byte_ptr )
                        ),
                        options
                    )

                    totHeadersLen += parsedKey.headers_tot_len;
                    totMsgLen += parsedKey.msg_len;
    
                    byte_ptr += parsedKey.headers_tot_len + parsedKey.msg_len;
                    
                    const parsedValue = Cbor._parse(
                        BufferUtils.copy(
                            bytes.slice( byte_ptr )
                        ),
                        options
                    );
    
                    totHeadersLen += parsedValue.headers_tot_len;
                    totMsgLen += parsedValue.msg_len;
    
                    // byte_ptr now points to the next header
                    byte_ptr += parsedValue.headers_tot_len + parsedValue.msg_len;
    
                    map.push(
                        {
                            k: parsedKey.parsed,
                            v: parsedValue.parsed
                        }
                    );
                }

                return {
                    map: map,
                    msg_len: totMsgLen + 1 , // counting the last break byte too
                    headers_tot_len: totHeadersLen
                }

            break;
            
            default:
                throw new CborError("can't handle additional information " + addInfos + " for major type map ( 0b101_xxxxx ) ");
        }

    }
}
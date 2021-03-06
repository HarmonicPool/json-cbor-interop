import ISerializable from "../misc/interfaces/ISerializable";
import IJsonValueConvertible from "../misc/interfaces/JsonInterfaces/IJsonValueConvertible";
import RawJsonValue from "../misc/interfaces/JsonInterfaces/RawJsonValue";

import HexString from "../types/HexString";
import ObjectUtils from "../../utils/ObjectUtils";

import JsonCborError from "../misc/errors/JsonCborError.ts";
import makeConstructionError from "../../utils/error_creation/makeConstructionError";
import shouldNeverGetHereError from "../../utils/error_creation/shouldNeverGetHereError";
import Cbor, { CborParseOptions } from "../Cbor";
import CborString from "../types/HexString/CborString";
import UInt64 from "../types/UInt64";
import ICborConvertible from "../misc/interfaces/CborInterfaces/ICborConvertible";

export type JsonCborKey = 
"string"    |
"list"      |
"map"       |
"int"       |
"bytes"     |
"tag"       |
"data"      
;

export type JsonCborValue =
    JsonCborMap     |
    JsonCborList    |
    JsonCborString  |
    JsonCborInt     |
    JsonCborBytes   |
    JsonCborTag     |
    JsonCbor_float_or_simple
;

export type RawJsonCborValue =
    RawJsonCborMap      |
    RawJsonCborList     |
    RawJsonCborString   |
    RawJsonCborInt      |
    RawJsonCborBytes    |
    RawJsonCborTag      |
    RawJsonCbor_float_or_simple
;

export interface FromJsonValueOptions
{
    stringHandler: ( str: string ) => RawJsonCborValue 
}

export default
class JsonCbor 
    implements IJsonValueConvertible, ISerializable
{
    protected _obj: RawJsonCborValue;
    
    constructor( obj: RawJsonCborValue )
    {
        if( !JsonCbor.isValid( obj ) )
        {
            throw makeConstructionError<JsonCborError>( "JsonCbor", "JsonCborValue", obj );
        }
        
        this._obj = obj;
    }

    toRawObject(): RawJsonCborValue
    {
        const oKeys = Object.keys( this._obj );

        if(
            ObjectUtils.has_n_determined_keys( this._obj, 2, "tag", "data" ) &&
            JsonCbor.isValidValueForKey( "tag", (this._obj as RawJsonCborTag ).tag ) &&
            JsonCbor.isValidValueForKey( "data", (this._obj as RawJsonCborTag ).data )
        )
        {
            return new JsonCborTag( this._obj as RawJsonCborTag ).toRawObject()
        }

        if(!(
            ObjectUtils.hasUniqueKey( this._obj ) &&
            JsonCbor.isValidKey( oKeys[0] )
        )) 
        {
            throw shouldNeverGetHereError<JsonCborError>( "JsonCbor.toRawObject" );
        }

        switch( oKeys[0] as JsonCborKey )
        {
            case "bytes":       return new JsonCborBytes( this._obj as RawJsonCborBytes ).toRawObject();
            case "int":         return new JsonCborInt( this._obj as RawJsonCborInt ).toRawObject();
            case "string":      return new JsonCborString( this._obj as RawJsonCborString ).toRawObject();
            case "list":        return new JsonCborList( this._obj as RawJsonCborList ).toRawObject();
            case "map":         return new JsonCborMap( this._obj as RawJsonCborMap ).toRawObject();

            default: throw shouldNeverGetHereError<JsonCborError>( "JSonCbor.toRawObject" );
        }
    }

    static fromCbor( cbor : CborString | string | Buffer, options?: CborParseOptions ): JsonCbor
    {
        return Cbor.parse( cbor, options );
    }

    toCbor(): CborString
    {
        return Cbor.fromJsonCbor( this );
    }

    static utils_FromJsonValueOptions = Object.freeze({
        intStringHandler: (
            str: string,
            {stringHandler}: FromJsonValueOptions
                = JsonCbor.defaultFromJsonValueOpts
        ) => {
            if( // checks if it can be converted to a number
                
                str.split("") // gets an array of char
                .every( 
                    // for each char checks if it is a number
                    ch => "0987654321".includes(ch) 
                    // returns true if it is in fact a number
                    // returns false if not       
                )
            )
            {
                const uint64 = UInt64.fromBigInt( BigInt(str) );
                
                return (
                    uint64.is_uint32() ? // tries to reduce the size if it can
                    { int: uint64.to_uint32() }:
                    { int: uint64 }
                )
            }

            return stringHandler( str );
        }
    })

    static defaultFromJsonValueOpts: Readonly<FromJsonValueOptions> = Object.freeze(
    {
        stringHandler: ( str: string ): RawJsonCborValue =>
        {
            if( HexString.isHex(str) ) // prefers bytes
            {
                return { bytes: str };
            }
        /* actually useless as it will becoverd from Hex case

            else if( // checks if it can be converted to a number
                
                str.split("") // gets an array of char
                .map( 
                    // for each char checks if it is a number
                    ch => "0987654321".includes(ch) 
                    // returns true if it is in fact a number
                    // returns false if not        
                )
                .reduce( (bool1, bool2) => bool1 && bool2, true ) // && (AND) them all
            )
            {
                const uint64 = UInt64.fromBigInt( BigInt(str) );
                
                return (
                    uint64.is_uint32() ? // tries to reduce the size if it can
                    { int: uint64.to_uint32() }:
                    { int: uint64 }
                )
            }

        //*/

            // in the last case returns it as utf8 text
            return{
                string: str
            };
        }
    })

    static fromJsonValue(
        jsonValue: RawJsonValue,
        options?: FromJsonValueOptions
    ): JsonCbor
    {
        const opt: FromJsonValueOptions = {
            ...JsonCbor.defaultFromJsonValueOpts,
            ...options
        };

        if(typeof jsonValue === "number" )
        {
            return new JsonCbor({
                int: jsonValue
            });
        }
        else if( typeof jsonValue === "string" )
        {
            return new JsonCbor(opt.stringHandler( jsonValue ) );
        }
        // else object

        if( Array.isArray( jsonValue ))
        {
            return new JsonCbor({
                list: jsonValue.map( elem => JsonCbor.fromJsonValue(elem, opt).toRawObject() )
            })
        }
        
        // object
        const oKeys = Object.keys( jsonValue );
        const jsonCborMap: RawJsonCborMapPair[] = [];

        for( let i = 0; i < oKeys.length; i++ )
        {
            let rawKey: RawJsonCborValue;
            try
            {
                // if the JsonValue has beengenerated from a CBOR
                // the key could be anything
                // and we would like to preserve that
                const parsedKey = JSON.parse( oKeys[i] );

                if( typeof parsedKey === "number" )
                {
                    const uint64 = UInt64.fromBigInt( BigInt(parsedKey) )
                    rawKey = { int: uint64.is_uint32() ? uint64.to_int32() : uint64 }
                }
                else // list or map
                {
                    rawKey = JsonCbor.fromJsonValue( parsedKey ).toRawObject();
                }
            }
            catch (e)
            {
                if( e instanceof SyntaxError )
                {
                    // bytes or string

                    // key was a valid string, (but not a number)
                    // therefore it can be interpreted as bytes or strings
                    rawKey = opt.stringHandler( oKeys[i] );
                }
                else throw e;
            }

            jsonCborMap.push({
                k: rawKey,
                v: JsonCbor.fromJsonValue( (jsonValue as any)[ oKeys[i] ]).toRawObject()
            });
        }

        return new JsonCbor({
            map: jsonCborMap
        })
    }

    toJsonValue(): RawJsonValue
    {
        const oKeys = Object.keys( this._obj );
        if(!(
            ObjectUtils.hasUniqueKey( this._obj ) &&
            JsonCbor.isValidKey( oKeys[0] )
        )) 
        {
            throw shouldNeverGetHereError<JsonCborError>( "JsonCbor.toJsonValue" );
        }

        switch( oKeys[0] as JsonCborKey )
        {
            case "bytes":       return new JsonCborBytes( this._obj as RawJsonCborBytes ).toJsonValue();
            case "int":         return new JsonCborInt( this._obj as RawJsonCborInt ).toJsonValue();
            case "string":      return new JsonCborString( this._obj as RawJsonCborString ).toJsonValue();
            case "list":        return new JsonCborList( this._obj as RawJsonCborList ).toJsonValue();
            case "map":         return new JsonCborMap( this._obj as RawJsonCborMap ).toJsonValue();

            default: throw shouldNeverGetHereError<JsonCborError>( "JSonCbor.toJsonValue" );
        }
    }

    // TODO updateto floats and tags and simple
    // TODO update keys
    // TODO update values
    static isValid( obj: object ): boolean
    {
        const keys = Object.keys( obj );

        if(
            ObjectUtils.has_n_determined_keys( obj, 2, "tag", "data" ) &&
            JsonCbor.isValidValueForKey( "tag", (obj as RawJsonCborTag ).tag ) &&
            JsonCbor.isValidValueForKey( "data", (obj as RawJsonCborTag ).data )
        )
        {
            return true;
        }

        return (
            ObjectUtils.hasUniqueKey( obj ) &&
            JsonCbor.isValidKey( keys[0] ) &&
            JsonCbor.isValidValueForKey( keys[0] as JsonCborKey, (obj as any)[ keys[0] ] )
        )
    }

    // TODO updateto floats and tags and simple
    static isValidKey( key: string ): boolean
    {
        return (
            key === "string"    ||
            key === "list"      ||
            key === "map"       ||
            key === "int"       ||
            key === "bytes"     ||
            key === "tag"       ||
            key === "data"
        )
    }

    // TODO updateto floats and tags and simple
    static isValidValueForKey( key: JsonCborKey, value: any ): boolean
    {
        switch( key )
        {
            case "bytes"    :   return ( typeof value === "string" && JsonCborBytes.isValidValue( value ) );
            case "int"      :   return (
                    (typeof value === "number" || value instanceof UInt64 ) &&
                    JsonCborInt.isValidValue( value )
                );
            case "list"     :   return ( Array.isArray( value ) && JsonCborList.isValidValue( value ) );
            case "map"      :   return JsonCborMap.isValidValue( value );
            case "string"   :   return ( typeof value === "string" && JsonCborString.isValidValue( value ) );
            case "tag"      :   return JsonCborInt.isValidValue( value )
            case "data"     :   return JsonCbor.isValid( value );
        }
    }

}

interface RawJsonCborMapPair
{
    k: RawJsonCborValue, v: RawJsonCborValue
}
export interface RawJsonCborMap
{
    map: RawJsonCborMapPair[]
}

export class JsonCborMap
    implements IJsonValueConvertible, ISerializable
{
    protected _jsonCborMap : RawJsonCborMap;

    constructor( jsonCborMap: RawJsonCborMap )
    {
        if( !JsonCborMap.isValid( jsonCborMap ) )
        {
            throw makeConstructionError<JsonCborError>( "JsonCborMap", "{ map: { k: JsonCborValue, v: JsonCborValue }[] }", jsonCborMap )
        }

        this._jsonCborMap = jsonCborMap;
    }

    static isValid( obj: object )
    {
        return(
            ObjectUtils.isObject( obj ) &&
            ObjectUtils.hasUniqueKey( obj, "map" ) &&
            JsonCborMap.isValidValue( (obj as any)["map"] )
        );
    }

    static isValidValue( any: any ): boolean
    {
        // must be an Array
        if( !Array.isArray( any ) ) return false;

        for( let i = 0; i < any.length; i++ )
        {
            // i'th element respects { k: JsonCbor, v: JsonCbor }
            if( !JsonCborMap._isValidValueElement( any[i] ) ) return false;
        }

        return true;
    }

    private static _isValidValueElement( obj: object ): boolean
    {
        // must be an object but not an Array
        if( !ObjectUtils.isObject( obj ) ) return false;

        // only object accepted are of the kind { k: JsonCbor, v: JsonCbor }
        if(!(
            ObjectUtils.hasNkeys( obj, 2 ) &&
            ObjectUtils.containsKeys( obj, "k", "v" )
        )) return false;

        return (
            JsonCbor.isValid( (obj as any)["k"] ) &&
            JsonCbor.isValid( (obj as any)["v"] )
        )
    }

    toJsonValue(): object
    {
        let json: any = {};

        for( let i = 0; i < this._jsonCborMap.map.length; i++)
        {
            let key = new JsonCbor( this._jsonCborMap.map[i].k ).toJsonValue();

            // bytes and strings are valid keys without the need of stringify of course
            if( typeof key !== "string" )
            {
                // are stringified
                // list
                // maps
                // numbers
                key = JSON.stringify( key );
            }

            json[key] = new JsonCbor( this._jsonCborMap.map[i].v ).toJsonValue();
        }

        return json;
    }

    /**
     * 
     * @returns a copy of the raw map object
     */
    toRawObject(): RawJsonCborValue
    {
        let mapArray: Array<RawJsonCborMapPair> = [];

        for( let i = 0; i < this._jsonCborMap.map.length; i++)
        {
            mapArray.push({ 
                k: new JsonCbor( this._jsonCborMap.map[i].k ).toRawObject(),
                v: new JsonCbor( this._jsonCborMap.map[i].v ).toRawObject()
            });
        }

        return {
            map: mapArray
        };
    }

}


export interface RawJsonCborList
{
    list: RawJsonCborValue[]
}

export class JsonCborList
    implements IJsonValueConvertible, ISerializable
{
    protected _jsonCborList : RawJsonCborList;

    constructor( jsonCborList: RawJsonCborList )
    {
        if( !JsonCborList.isValid( jsonCborList ) )
        {
            throw makeConstructionError<JsonCborError>( "JsonCborList", "{ list: RawJsonCborValue[] }", jsonCborList );
        };

        this._jsonCborList = jsonCborList;
    }

    static isValid( obj: RawJsonCborList )
    {
        return(
            ObjectUtils.isObject( obj ) &&
            ObjectUtils.hasUniqueKey( obj, "list" ) &&
            JsonCborList.isValidValue( obj["list"] )
        );
    }

    static isValidValue( any: RawJsonCborValue[] ): boolean
    {
        // must be an Array
        if( !Array.isArray( any ) ) return false;

        for( let i = 0; i < any.length; i++ )
        {
            // i'th element is itself a JsonCbor
            // true for all i(s)
            if( !JsonCbor.isValid( any[i] ) ) return false;
        }

        return true;
    }

    toJsonValue(): object
    {
        let arr: Array<RawJsonValue> = [];

        for( let i = 0; i < this._jsonCborList.list.length; i++)
        {
            arr.push( new JsonCbor( this._jsonCborList.list[i] ).toJsonValue() );
        }

        return arr;
    }

    toRawObject(): RawJsonCborList
    {
        let obj: Array<RawJsonCborValue> = [];

        for( let i = 0; i < this._jsonCborList.list.length; i++)
        {
            obj.push( new JsonCbor( this._jsonCborList.list[i] ).toRawObject() );
        }

        return {
            list: obj
        };
    }
    
}


export interface RawJsonCborString
{
    string: string // less than 64 char ???
}

export class JsonCborString
    implements IJsonValueConvertible, ISerializable
{
    protected _jsonCborString : RawJsonCborString;

    constructor( jsonCborStr: RawJsonCborString )
    {
        if( !JsonCborString.isValid( jsonCborStr ) )
        {
            throw makeConstructionError<JsonCborError>( "JsonCborString", "{ string: string }", jsonCborStr );
        }

        this._jsonCborString  = jsonCborStr;
    }

    static isValid( obj: RawJsonCborString )
    {
        return(
            ObjectUtils.isObject( obj ) &&
            ObjectUtils.hasUniqueKey( obj, "string" ) &&
            JsonCborString.isValidValue( obj["string"] )
        );
    }

    static isValidValue( str: string ): boolean
    {
        return ( typeof str === "string" );
    }

    toJsonValue(): string
    {
        return this._jsonCborString.string;
    }

    toRawObject(): RawJsonCborString
    {
        return this._jsonCborString;
    }

    //
}

export interface RawJsonCborInt
{
    int: number | UInt64
}

export class JsonCborInt
    implements IJsonValueConvertible, ISerializable
{
    protected _rawInt : RawJsonCborInt;

    constructor( jsonCborInt: RawJsonCborInt )
    {
        if( !JsonCborInt.isValid( jsonCborInt ) )
        {
            throw makeConstructionError<JsonCborError>( "JsonCborInt", "{ int: number | Uint64 }", jsonCborInt );
        }

        this._rawInt = jsonCborInt;
    }

    static isValid( obj: { int: number | UInt64 } ): boolean
    {
        return (
            ObjectUtils.isObject( obj ) &&
            ObjectUtils.hasUniqueKey( obj, "int" ) &&
            JsonCborInt.isValidValue( obj["int"] )
        );
    }

    static isValidValue( any: number | bigint | UInt64 ): boolean
    {
        if( typeof any === "bigint" ) return true;

        if( typeof any === "object" )
        {
            return (any instanceof UInt64)
        }

        if( typeof any !== "number" ) return false;

        return (
            Math.round( any ) === any
        );
    }

    toJsonValue(): number | string
    {
        const int : number | UInt64 | bigint = this._rawInt.int
        return (
            ( 
                int instanceof UInt64 ? 
                int.to_bigint().toString() :
                int
            )
        );
    }

    toRawObject(): RawJsonCborInt
    {
        return this._rawInt;
    }

    //
}


interface private_RawJsonCborBytes
{
    bytes: HexString
}

export interface RawJsonCborBytes
{
    bytes: string
}
export class JsonCborBytes
    implements IJsonValueConvertible, ISerializable
{
    protected _rawBytes : private_RawJsonCborBytes;

    constructor( jsonCborBytes: RawJsonCborBytes )
    {
        if( !JsonCborBytes.isValid( jsonCborBytes ) )
        {
            throw makeConstructionError<JsonCborError>( "JsonCborBytes", "{ bytes: string (hex) }", jsonCborBytes );
        }

        this._rawBytes = {
            bytes: new HexString( jsonCborBytes.bytes )
        };
    }

    static isValid( obj: RawJsonCborBytes ): boolean
    {
        return (
            ObjectUtils.isObject( obj ) &&
            ObjectUtils.hasUniqueKey( obj, "bytes" ) &&
            JsonCborBytes.isValidValue( obj["bytes"] )
        )
    }

    static isValidValue( bytes: string | Buffer ): boolean
    {
        if( Buffer.isBuffer( bytes ) ) return true;

        if( typeof bytes !== "string" ) return false;

        return(
            HexString.isHex( bytes ) ||
            (HexString.isHex( bytes.slice(2) ) && bytes.slice( 0, 2 ) == "0x" )
        )
    }

    toJsonValue(): string
    {
        return this._rawBytes.bytes.asString;
    }

    toRawObject(): RawJsonCborBytes 
    {
        return {
            bytes: this._rawBytes.bytes.asString
        };
    }
}


export interface RawJsonCborTag
{
    tag: number | UInt64
    data: RawJsonCborValue
}
export class JsonCborTag
    implements ICborConvertible, IJsonValueConvertible, ISerializable
{
    private _tag: RawJsonCborTag;

    constructor( tag: RawJsonCborTag )
    {
        if( !JsonCborTag.isValid( tag ) )
        {
            throw makeConstructionError<JsonCborError>(
                "JsonCborTag constructor",
                "{ tag : number }",
                tag
            )
        }

        this._tag = tag;
    }

    static isValid(tag: RawJsonCborTag): boolean
    {
        return ObjectUtils.has_n_determined_keys( tag, 2, "tag", "data" );
    }

    toRawObject(): RawJsonCborTag
    {
        return this._tag;
    }

    toJsonValue(): RawJsonValue
    {
        return new JsonCbor( this._tag.data ).toJsonValue();
    }

    toCbor(): CborString
    {
        return Cbor.fromJsonCbor( this.toRawObject() )
    }
}


export interface RawJsonCborSimple
{
    simple: boolean | null | undefined
}
export interface RawJsonCborFloat
{
    float: number
}
export type RawJsonCbor_float_or_simple = RawJsonCborFloat | RawJsonCborSimple
export class JsonCbor_float_or_simple
    implements ICborConvertible, IJsonValueConvertible, ISerializable
{
    private _data: RawJsonCbor_float_or_simple;

    constructor( rawData: RawJsonCbor_float_or_simple )
    {
        if( !JsonCbor_float_or_simple.isValid( rawData ) )
        {
            makeConstructionError<JsonCborError>(
                "JsonCbor_float_or_simple constructor",
                "{ float: number } or { simple: boolean | null | undefined }",
                rawData
            )
        }

        this._data = rawData;
    }

    static isValid( data: RawJsonCbor_float_or_simple )
    {
        return (
            JsonCbor_float_or_simple.isFloat( data as RawJsonCborFloat ) || 
            JsonCbor_float_or_simple.isSimple( data as RawJsonCborSimple )
        );
    }

    static isFloat( data: RawJsonCborFloat ): boolean
    {
        return (
            ObjectUtils.hasUniqueKey( data, "float" ) &&
            typeof data.float === "number"
        )
    }

    static isSimple( data: RawJsonCborSimple ): boolean
    {
        return (
            ObjectUtils.hasUniqueKey( data, "simple" ) &&
            (
                typeof data.simple === "boolean" ||
                typeof data.simple === "undefined" ||
                data.simple === null || data.simple === undefined
            )
        )
    }

    toCbor(): CborString
    {
        return Cbor.fromJsonCbor( this._data );
    }

    toRawObject(): RawJsonCbor_float_or_simple
    {
        return this._data;
    }

    toJsonValue(): RawJsonValue
    {
        if( JsonCbor_float_or_simple.isFloat( this._data as RawJsonCborFloat ) )
        {
            return ( this._data as RawJsonCborFloat ).float;
        }

        if( JsonCbor_float_or_simple.isSimple( this._data as RawJsonCborSimple ) )
        {
            return ( this._data as RawJsonCborSimple ).simple
        }
    }
}
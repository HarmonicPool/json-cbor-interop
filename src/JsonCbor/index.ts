import ISerializable from "../interfaces/ISerializable";
import IJsonValueConvertible from "../interfaces/JsonInterfaces/IJsonValueConvertible";
import RawJsonValue from "../interfaces/JsonInterfaces/RawJsonValue";

import HexString from "../types/HexString";
import ObjectUtils from "../../utils/ObjectUtils";

import JsonCborError from "../errors/JsonCborError.ts";
import makeConstructionError from "../../utils/error_creation/makeConstructionError";
import shouldNeverGetHereError from "../../utils/error_creation/shouldNeverGetHereError";
import Cbor from "../Cbor";
import CborString from "../types/HexString/CborString";
import UInt64 from "../types/UInt64";

export type JsonCborKey = 
"string"    |
"list"      |
"map"       |
"int"       |
"bytes"
;

export type JsonCborValue =
    JsonCborMap     |
    JsonCborList    |
    JsonCborString  |
    JsonCborInt     |
    JsonCborBytes
;

export type RawJsonCborValue =
    RawJsonCborMap      |
    RawJsonCborList     |
    RawJsonCborString   |
    RawJsonCborInt      |
    RawJsonCborBytes
;


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

    static fromCbor( cbor : CborString | string | Buffer ): JsonCbor
    {
        return Cbor.parse( cbor );
    }

    toCbor(): CborString
    {
        return Cbor.fromJsonCbor( this );
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

    static isValid( obj: object ): boolean
    {
        const keys = Object.keys( obj );

        return (
            ObjectUtils.hasUniqueKey( obj ) &&
            JsonCbor.isValidKey( keys[0] ) &&
            JsonCbor.isValidValueForKey( keys[0] as JsonCborKey, (obj as any)[ keys[0] ] )
        )
    }

    static isValidKey( key: string ): boolean
    {
        return (
            key === "string"    ||
            key === "list"      ||
            key === "map"       ||
            key === "int"       ||
            key === "bytes"
        )
    }

    static isValidValueForKey( key: JsonCborKey, value: RawJsonCborValue ): boolean
    {
        switch( key )
        {
            case "bytes"    :   return ( typeof value === "string" && JsonCborBytes.isValidValue( value ) );
            case "int"      :   return ( typeof value === "number" && JsonCborInt.isValidValue( value ) );
            case "list"     :   return ( Array.isArray( value ) && JsonCborList.isValidValue( value ) );
            case "map"      :   return JsonCborMap.isValidValue( value );
            case "string"   :   return ( typeof value === "string" && JsonCborString.isValidValue( value ) );
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

            if( typeof key !== "string" )
            {
                key = JSON.stringify( key );
            }

            json[key] = new JsonCbor( this._jsonCborMap.map[i].v ).toJsonValue();
        }

        return json;
    }

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
        let arr: Array<string | number | object> = [];

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
    int: number | UInt64 | bigint
}

export class JsonCborInt
    implements IJsonValueConvertible, ISerializable
{
    protected _rawInt : RawJsonCborInt;

    constructor( jsonCborInt: RawJsonCborInt )
    {
        if( !JsonCborInt.isValid( jsonCborInt ) )
        {
            throw makeConstructionError<JsonCborError>( "JsonCborInt", "{ int: number | Uint64 | bigint }", jsonCborInt );
        }

        this._rawInt = jsonCborInt;
    }

    static isValid( obj: { int: number | UInt64 | bigint } ): boolean
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
                (typeof int === "bigint" ?
                int.toString():
                int)
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
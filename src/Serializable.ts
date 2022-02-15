import SerializableError from "./SerializableError"
import ISerializable from "./interfaces/ISerializable";

export default
class Serializable
    implements ISerializable
{
    protected _obj: object;

    constructor( obj: object )
    {
        if ( !Serializable.isSerializable( obj ) )
        {
            throw new SerializableError("tryng to construct a Serializable instance with a non serializable object");
        }
        
        this._obj = obj;
    }

    toRawObject(): object
    {
        return this._obj;
    }

    static isSerializable( obj: object ): boolean
    {
        const keys = Object.keys( obj );

        for( let i = 0; i < keys.length; i++)
        {
            const value = ( obj as any )[keys[i]];

            if(
                typeof value === "number" ||
                typeof value === "bigint" ||
                typeof value === "boolean" ||
                typeof value === "string" ||
                typeof value === "undefined"
            ) continue; // this single value is true, don't know the others
            else
            {
                if( Array.isArray( value ) )
                {
                    for( let i = 0; i < value.length; i++ )
                    {
                        // all array elements must be serilalizable to
                        // equivalent to AND all elments
                        if( !Serializable.isSerializable( value[i] ) ) return false;
                    }
                }
                else if ( typeof value === "object" )
                {
                    if( !Serializable.isSerializable( value ) ) continue; // this single value is true, don't know the others
                    else return false;
                }
                else if( typeof value === "function" ) return false;
            }
        }

        return true;
    }

}
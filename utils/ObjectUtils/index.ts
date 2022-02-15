
export interface IObjectUtils
{
    isNotArray:     () => boolean
    isObject:       () => boolean
    hasUniqueKey:   ( key?: string ) => boolean
    hasNKeys:       ( n: number ) => boolean
    containsKeys:   ( ...keys : string[] ) => boolean
}

export default class ObjectUtils
{
    private constructor () {}

    static isNotArray( obj: object ): boolean
    {
        return !Array.isArray( obj );
    }

    static isObject( obj: any ): boolean
    {
        return (
            typeof obj === "object" &&
            ObjectUtils.isNotArray( obj ) &&
            obj !== null &&
            obj !== undefined // maybe useless since "typeof" would have returned "undefined"
        )
    }

    static hasUniqueKey( obj: object, key: (string | undefined) = undefined ): boolean
    {
        const keys = Object.keys( obj );
        return (
            keys.length === 1 &&
            ( typeof key !== "undefined" ? keys[0] === key : true )
        );
    }

    static hasNkeys( obj: object, n: number): boolean
    {
        return (Object.keys( obj ).length === n);
    }

    static containsKeys( obj: object, ...keys : string[] ): boolean
    {
        const oKeys = Object.keys( obj );

        for( let i = 0; i < keys.length; i++ )
        {
            if( !oKeys.includes( keys[i] ) ) return false;
        }

        return true
    }

    static deepEqual( a: any , b: any ): boolean
    {
        if( typeof a !== typeof b )
        {
            return false;
        }

        /*
        covers:
        - nuber
        - strings
        - boolean
        - functions only if are the same object
        ( unfortunately, proving deep function equality is not possible (yet) )
        */
        if( a === b )
        {
            return true;
        }
    
        if( Array.isArray(a) )
        {
            if(Array.isArray(b))
            {
                if( a.length !== b.length ) return false;
    
                for(let i = 0 ; i < a.length; i++ )
                {
                    if(
                        !ObjectUtils.deepEqual( a[i], b[i] )
                    )
                    {
                        return false;
                    }
                }
    
                return true;
            }
            else // a and b are not both arrays
            {
                return false;
            }
        }
        else if(Array.isArray(b)) return false; // a is an array indeed
    
        // type equality checked before, no need to re-check
        if( typeof a === "object" )
        {
            const aKeys = Object.keys(a);
            const bKeys = Object.keys(b);
    
            if( aKeys.length !== aKeys.length )
            {
                return false;
            }
    
            // {} === {} -> true
            if( aKeys.length === 0 && bKeys.length === 0 )
            {
                return true;
            }
    
            for( let i = 0 ; i < aKeys.length; i++ )
            {
                let foundThis_a = false;
    
                for(let j = 0; j < bKeys.length; j++)
                {
                    if( aKeys[i] === bKeys[j] )
                    {
                        foundThis_a = true;
                        break;
                    }
                }
    
                if(foundThis_a)
                {
                    if (ObjectUtils.deepEqual( a[aKeys[i]], b[aKeys[i]] ))
                    {
                        if( i === (aKeys.length - 1) )
                        {
                            return true;
                        }
                        continue;
                    }
                    else return false;
                }
                else
                {
                    return false;
                }
            }
        }
        
        return false;
    }
    
    static deepClone<T = any>( obj: T ): T
    {
        let clone: T;

        //@ts-ignore
        if( typeof obj === "function" ) return cloneFunc( obj ); 

        if( typeof obj === "object")
        {
            if( Array.isArray( obj ) )
            {
                for( let i = 0; i < obj.length; i++)
                {
                    clone[i] = ObjectUtils.deepClone(obj[i]);
                }

                return clone;
            }

            const objKeys = Object.keys( obj );

            for( let i = 0 ; i < objKeys.length; i++ )
            {
                clone[ objKeys[i] ] = ObjectUtils.deepClone( obj[ objKeys[i] ] );
            }

            return clone;
        }

        // number
        // string
        // boolean
        return obj;
    }
}

function cloneFunc( func: Function ): Function
{
    let cloneObj = func;

    //@ts-ignore
    if(func.__isClone) {
        //@ts-ignore
        cloneObj = func.__clonedFrom;
    }

    let temp = function() { return cloneObj.apply(this, arguments); };

    for(let key in func) {
        temp[key] = func[key];
    }

    //@ts-ignore
    temp.__isClone = true;
    //@ts-ignore
    temp.__clonedFrom = cloneObj;

    return temp;
};
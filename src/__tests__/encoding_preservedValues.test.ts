import JsonCbor from "../JsonCbor"
import UInt64 from "../types/UInt64";


test("minimal CBORs preserved", () =>
{
    expect(
        JsonCbor.fromCbor("83010203").toCbor().asString
    ).toBe("83010203");

    expect(
        JsonCbor.fromCbor("a16568656c6c6f65776f726c64").toCbor().asString
    ).toBe("a16568656c6c6f65776f726c64");

    expect(
        JsonCbor.fromCbor("a26568656c6c6f65776f726c64430f32b584010266737472696e67a0").toCbor().asString
    ).toBe("a26568656c6c6f65776f726c64430f32b584010266737472696e67a0");

    expect(
        JsonCbor.fromCbor("a26568656c6c6f65776f726c64430f32b58501021b000000020000000066737472696e67a0").toCbor().asString
    ).toBe("a26568656c6c6f65776f726c64430f32b58501021b000000020000000066737472696e67a0");
})

test("non minimal CBORs become minimal", () =>
{
    expect(
        JsonCbor.fromCbor("a26568656c6c6f65776f726c64430f32b5841b00000000000000011b000000000000000266737472696e67a0").toCbor().asString
    ).toBe("a26568656c6c6f65776f726c64430f32b584010266737472696e67a0");
    
    expect(
        JsonCbor.fromCbor("a26568656c6c6f65776f726c64430f32b5851b00000000000000011b00000000000000021b000000020000000066737472696e67a0").toCbor().asString
    ).toBe("a26568656c6c6f65776f726c64430f32b58501021b000000020000000066737472696e67a0");
})

test("JsonCbor preserved", () =>
{
    expect(
        new JsonCbor({ int: 1 }).toCbor().toJsonCbor().toRawObject()
    ).toEqual({int:1})

    expect(
        new JsonCbor({
            list: [
                {int: 1},
                {int: 2},
                {int: 3},
            ]
        }).toCbor().toJsonCbor().toRawObject()
    ).toEqual({
        list: [
            {int: 1},
            {int: 2},
            {int: 3},
        ]
    })

    expect(
        new JsonCbor({
            map: [
                {
                    k: {bytes: "abcdef"},
                    v: {int:42}
                }
            ]
        }).toCbor().toJsonCbor().toRawObject()
    ).toEqual({
        map: [
            {
                k: {bytes: "abcdef"},
                v: {int:42}
            }
        ]
    });

    expect(
        new JsonCbor({ int: UInt64.fromBigInt( BigInt( 3 ) << BigInt( 53 ) ) }).toCbor().toJsonCbor().toRawObject()
    ).toEqual({ int: UInt64.fromBigInt( BigInt( 3 ) << BigInt( 53 ) ) })
})

test("JsonCbor int minimized", () =>
{
    expect(
        new JsonCbor({ int: UInt64.fromBigInt( BigInt( 3 ) << BigInt( 53 ) ) }).toCbor().toJsonCbor().toRawObject()
    ).toEqual({ int: UInt64.fromBigInt( BigInt( 3 ) << BigInt( 53 ) ) })
    
    expect(
        new JsonCbor({ int: UInt64.fromBigInt( BigInt( 3 ) << BigInt( 20 ) ) }).toCbor().toJsonCbor().toRawObject()
    ).toEqual({ int: 3 << 20 })

    expect(
        new JsonCbor({ int: UInt64.fromBigInt( BigInt( 3 ) << BigInt( 20 ) ) }).toCbor().toJsonCbor().toRawObject()
    ).not.toEqual({ int: UInt64.fromBigInt( BigInt( 3 ) << BigInt( 20 ) ) })
})

test("non pure Json handled correctly", () =>
{
    const strangeJson = new JsonCbor({
        map: [
            {
                k: { list: [
                    {int:1},
                    {int:2},
                    {int:3}
                ]},
                v: { int: 2 }
            }
        ]
    });

    const strangerJson = new JsonCbor({
        map: [
            {
                k: { map: [
                    {
                        k: {
                            map: [
                                {
                                    k: {map: []},
                                    v: {map: []}
                                }
                            ]
                        },
                        v: {map: []}
                    }
                ]},
                v: {map:[]}
            }
        ]
    });


    expect(
        strangeJson.toJsonValue()
    ).toEqual({"[1,2,3]": 2})

    expect(
        strangeJson.toCbor().asString
    ).toBe("a18301020302")

    expect(
        strangerJson.toJsonValue()
    ).toEqual({
        "{\"{\\\"{}\\\":{}}\":{}}":{} // inner excapes must be preserved
    // first parse: "{ \"{}\":{} }" : {}
    // second parse:   "{}" : {}
    // final parsed:
    /*
    {
        {
            {}: {}
        }: {}
    }: {}
    */
    })
    expect(
        strangerJson.toCbor().asString
    ).toBe("a1a1a1a0a0a0a0")
})
import JsonCbor, { JsonCborBytes, JsonCborInt, JsonCborList, JsonCborMap, JsonCborString } from "..";

jest.mock("@emurgo/cardano-serialization-lib-asmjs/cardano_serialization_lib.asm.js",() => jest.fn());
jest.mock("@emurgo/cardano-serialization-lib-asmjs",() => jest.fn());


test("keys are recognized", () =>
{
    const chars = "qwertyuioplkjhgfdsazxcvbnm1234567890QWERTYUIOPLKJHGFDSAZXCVBNM";

    expect(JsonCbor.isValidKey("map")).toBe(true);
    expect(JsonCbor.isValidKey("string")).toBe(true);
    expect(JsonCbor.isValidKey("int")).toBe(true);
    expect(JsonCbor.isValidKey("list")).toBe(true);
    expect(JsonCbor.isValidKey("bytes")).toBe(true);


    expect(JsonCbor.isValidKey("Map")).toBe(false);
    expect(JsonCbor.isValidKey("iNt")).toBe(false);
    expect(JsonCbor.isValidKey("LiSt")).toBe(false);
    expect(JsonCbor.isValidKey("ByTes")).toBe(false);
    expect(JsonCbor.isValidKey("str")).toBe(false);


    for( let i = 0; i < 50; i++ )
    {
        let str = "";
        const strLen = Math.round(Math.random() * 5) + 2;

        for( let i = 0; i < strLen; i++ )
        {
            str += chars[ Math.round(Math.random() * chars.length) ];
        }

        if(
            str !== "map"       &&
            str !== "string"    &&
            str !== "int"       &&
            str !== "list"      &&
            str !== "bytes"
        )
        {
            expect(JsonCbor.isValidKey(str)).toBe(false);
        }
    }

})

test("isValidStringValue evaluates correctly", () => {

    expect(JsonCborString.isValidValue("ciaone")).toBe(true);

    expect(JsonCborString.isValidValue(1 as any)).toBe(false);

})

test("isValidIntValue evaluates correctly", () => {

    expect(JsonCborInt.isValidValue(1)).toBe(true);
    expect(JsonCborInt.isValidValue(1.0)).toBe(true);


    expect(JsonCborInt.isValidValue(1.1)).toBe(false);
    expect(JsonCborInt.isValidValue("str" as any)).toBe(false);
})

test("isValidBytesValue evaluates correctly", () => {

    expect(JsonCborBytes.isValidValue("abcdef01")).toBe(true);
    expect(JsonCborBytes.isValidValue(Buffer.from("abcdef","hex"))).toBe(true);


    expect(JsonCborBytes.isValidValue({} as any)).toBe(false);
    expect(JsonCborBytes.isValidValue("commonStr")).toBe(false);
})

test("isValidListValue evaluates correctly", () => {

    expect(
        JsonCborList.isValidValue([
            { "int": 3 },
            { "string":  "ciao" },
            { "bytes": "abcdef" }
        ])
    ).toBe(true);

    expect(
        JsonCborList.isValidValue([
            3,
            "ciao",
            "abcdef"
        ] as any )
    ).toBe(false);
})

test("simple JsonCborMap validity", () =>
{
    expect(
        JsonCborMap.isValidValue([])
    ).toBe(true);
})

test("isValidMapValue evaluates correctly", () => {

    expect(
        JsonCborMap.isValidValue([
            {
                k: {"string": "key"},
                v: { "int": 42 }
            }
        ])
    ).toBe(true);

    expect(
        JsonCborMap.isValidValue([
            {
                k: {"string": "key"},
                v: { "int": 1 }
            },
            {
                k: {"string": "key"},
                v: { "int": 2 }
            },
            {
                k: {"list": [
                    { "int": 1 },
                    { "int": 2 },
                    { "int": 3 },
                ] },
                v: { "int": 3 }
            }
        ])
    ).toBe(true);

    expect(JsonCborMap.isValidValue( { k: "not a validJsonCbor" , v: { "int": 42 } } ) ).toBe(false);

    expect(JsonCborMap.isValidValue({})).toBe(false);
    expect(JsonCborMap.isValidValue({oroscopo: 2})).toBe(false);
    expect(JsonCborMap.isValidValue({k: 1})).toBe(false);
    expect(JsonCborMap.isValidValue({v: 2})).toBe(false);
    expect(JsonCborMap.isValidValue({v: 2, alberobello: 42})).toBe(false);
    expect(JsonCborMap.isValidValue(["map"])).toBe(false);
});
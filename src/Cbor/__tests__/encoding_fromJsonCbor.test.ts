import Cbor from ".."
import UInt64 from "../../types/UInt64";

test("simple values encoded normaly", () =>
{
    expect( Cbor.fromJsonCbor( { int: 1 } ).asString ).toBe("01");
    expect( Cbor.fromJsonCbor( { int: UInt64.fromBigInt( BigInt(3) ) } ).asString ).toBe("03");
    expect( Cbor.fromJsonCbor( { int: -5 } ).asString ).toBe("24");
    expect( Cbor.fromJsonCbor( { int: UInt64.fromBigInt( -BigInt(7) ) } ).asString ).toBe("26");

    expect( Cbor.fromJsonCbor( { string: "ciaone" } ).asString ).toBe("666369616F6E65".toLowerCase())

    expect(
        Cbor.fromJsonCbor({
            bytes: Buffer.from("ciaone", "ascii").toString("hex")
        }).asString
    ).toBe("466369616F6E65".toLowerCase())
});

test("lists encoded normaly", () =>
{
    expect(
        Cbor.fromJsonCbor(
            { list: [
                {int: 1},
                {int: 2},
                {int: 3}
            ]}
        ).asString
    ).toBe( "83010203".toLowerCase() )
})

test("maps encoded normaly", () =>
{
    expect(
        Cbor.fromJsonCbor(
            { map: [
                {
                    k: { bytes: Buffer.from("ciaone", "ascii").toString("hex") },
                    v: { string: "mondone"}
                },
                {
                    k: {int: 1},
                    v: { list: [
                        {int: 2},
                        {int: 3}
                    ]}
                }
            ]}
        ).asString
    ).toBe( "A2466369616F6E65676D6F6E646F6E6501820203".toLowerCase() )
})
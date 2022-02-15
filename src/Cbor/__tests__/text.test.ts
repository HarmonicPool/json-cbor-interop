import Cbor from ".."

test("limited size text parsed correctly", () => 
{
    expect( Cbor.parse( "64F09FA5B0" ).toJsonValue() ).toBe("🥰");
})

test("unlimited size text works", () =>
{
    expect(
        Cbor.parse(
            "7f7828f09f9889f09f988cf09f988df09fa5b0f09f9898f09f9897f09f9899f09f989af09f988bf09f989bff"
        ).toJsonValue()
    ).toBe("😉😌😍🥰😘😗😙😚😋😛");

    expect(
        () => Cbor.parse(
            "7f28f09f9889f09f988cf09f988df09fa5b0f09f9898f09f9897f09f9899f09f989af09f988bf09f989bff" // missing text header
        ).toJsonValue()
    ).toThrow();
})
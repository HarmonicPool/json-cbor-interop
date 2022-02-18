import Cbor from ".."
import CborString from "../../types/HexString/CborString";


test("one bytes unsigned parsed normally", () =>
{

    expect( Cbor.parse("01").toJsonValue() ).toBe( 1 );
    expect( Cbor.parse("1").toJsonValue() ).toBe( 1 ); // CborString conversion handles the string to be "01"

    expect( Cbor.parse( new CborString("10") ).toJsonValue() ).toBe(16);

})

test("one byte negative parsed normally", () => 
{

    expect( Cbor.parse( 0b001_00000.toString(16) ).toJsonValue() ).toBe( -1 )
    expect( Cbor.parse( 0b001_00001.toString(16) ).toJsonValue() ).toBe( -2 )
    expect( Cbor.parse( 0b001_00010.toString(16) ).toJsonValue() ).toBe( -3 )

    expect( Cbor.parse( "37" ).toJsonValue() ).toBe( -24 );
    expect( () => Cbor.parse( "38" ) ).toThrow(); // overflow from buffer, expected at least one more byte

})

test("uint8 parsed normaly",() => 
{
    expect( Cbor.parse( "1801" ).toJsonValue() ).toBe( 1 );
    expect( Cbor.parse( "18ff" ).toJsonValue() ).toBe( 255 );

    expect( () => Cbor.parse( "19ff" ) ).toThrow();

})

test("negative uint8 parsed normaly",() => 
{
    expect( Cbor.parse( "3800" ).toJsonValue() ).toBe( -1 );
    expect( Cbor.parse( "38ff" ).toJsonValue() ).toBe( -256 );

    expect( () => Cbor.parse( "39ff" ) ).toThrow();

})

test("uint16 parsed normaly", () =>
{
    expect( Cbor.parse( "190001" ).toJsonValue() ).toBe( 1 );
    expect( Cbor.parse( "19ffff" ).toJsonValue() ).toBe( 0xffff );

    expect( () => Cbor.parse( "1affff" ) ).toThrow();
})

test("negative uint16 parsed normaly", () =>
{
    expect( Cbor.parse( "390001" ).toJsonValue() ).toBe( -2 );
    expect( Cbor.parse( "39ffff" ).toJsonValue() ).toBe( -( 0xffff + 1 ) );

    expect( () => Cbor.parse( "3affff" ) ).toThrow();

})

test("uint32 parsed normaly", () =>
{
    expect( Cbor.parse( "1a 00 00 00 01" ).toJsonValue() ).toBe( 1 );
    expect( Cbor.parse( "1a ff ff ff ff" ).toJsonValue() ).toBe( 0xffffffff );

    expect( () => Cbor.parse( "1b ff ff ff ff" ) ).toThrow();
})

test("negative uint32 parsed normaly", () =>
{
    expect( Cbor.parse( "3a 00 00 00 01" ).toJsonValue() ).toBe( -2 );
    expect( Cbor.parse( "3a ff ff ff ff" ).toJsonValue() ).toBe( -( 0xffffffff + 1 ) );

    expect( () => Cbor.parse( "3b ff ff ff ff" ) ).toThrow();

})

test("positive uint64 parsed normaly", () =>
{
    expect(false).toBe(true);
});

test("negative uint64 parsed normaly", () =>
{
    expect(false).toBe(true);
})
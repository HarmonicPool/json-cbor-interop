import Cbor from ".."
import { MajorType } from "../Constants";


test("fixed bytes length parsed correctly", () =>
{
    expect( Cbor.parse("43 12 34 56").toJsonValue() ).toBe("123456");
})

test("undefinite length parsed correctly", () =>
{
    expect( Cbor.parse("5f4312345643123456ff").toJsonValue() ).toBe("123456123456");
})
import Cbor from "..";

test("simple length map parsed", () =>
{
    expect(
        Cbor.parse("a1656d794b657985010203406662616e616e61").toJsonValue()
    ).toEqual({
        "myKey": [1, 2, 3, '', "banana"]
    })
})

test("indefinite length map parsed", () =>
{
    expect(
        Cbor.parse("BF656D794B6579990005010203406662616E616E616A6D794F746865724B657985010203406662616E616E61FF").toJsonValue()
    ).toEqual({
        "myKey": [1, 2, 3, '', "banana"],
        "myOtherKey": [1, 2, 3, '', "banana"],
    })
})


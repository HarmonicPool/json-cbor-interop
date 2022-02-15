import Cbor from "..";


test("simple length array parsed correctly", () =>
{
    expect(
        Cbor.parse("85010203406662616e616e61").toJsonValue()
    ).toEqual([1,2,3,'',"banana"]);
})

test("definite length array parsed correctly", () =>
{
    expect(
        Cbor.parse("9805010203406662616e616e61").toJsonValue()
    ).toEqual([1,2,3,'',"banana"])
})
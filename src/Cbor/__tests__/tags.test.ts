import Cbor from ".."


test("simple parsing",() =>
{
    expect(
        Cbor.parse(
            "d818822003",
            {
                tagHandler: ( _rawTag ) => { return { shouldKeepTag: true, isValidData: true }; }
            }
        ).toRawObject()
    ).toEqual({
        tag:24,
        data: {
            list: [
                { int: -1 },
                { int:  3 }
            ]
        }
    })

    expect(
        () => Cbor.parse(
            "d818822003"
        ).toRawObject()
    ).toThrow(
        `failed parsing a tag value; data did not matched the required type for the tag;`+
        `\ntag was: ${24};`+
        `\ndata was: ${JSON.stringify({"list":[{"int":-1},{"int":3}]})}`
    );
})

test("non standard tags are ignored by default", () =>
{
    expect(Cbor.parse( "c602" ).toJsonValue() ).toBe(2);
    expect(
        Cbor.parse(
            "c602",
            {
                tagHandler: ( _rawTag ) => { return { shouldKeepTag: true, isValidData: true }; }
            }
        ).toRawObject()
    ).toEqual({
        tag: 6,
        data: { int: 2 }
    })

    const intList = {
        list: [
            { int: -1 },
            { int:  3 }
        ]
    };
    expect(
        Cbor.parse(
            "d97dde822003",
            {
                tagHandler: ( _rawTag ) => { return { shouldKeepTag: true, isValidData: true }; }
            }
        ).toRawObject()
    ).toEqual({
        tag: 32222,
        data: intList
    })
    expect(
        Cbor.parse(
            "d97dde822003"
        ).toRawObject()
    ).toEqual( intList )
})
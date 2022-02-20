import JsonCbor from ".."


test("on default options, strings are handled correctly", () =>
{
    expect(
        JsonCbor.fromJsonValue([
            "1", "4fd0", "cafe", "hello-world"
        ]).toRawObject()
    ).toEqual({
        list: [
            {bytes: "1"},
            {bytes: "4fd0"},
            {bytes: "cafe"},
            {string: "hello-world"},
        ]
    })
})

test("option.stringHandler can be personalized", () =>
{
    expect(
        JsonCbor.fromJsonValue([
            "1", "4fd0", "cafe", "hello-world"
        ],
        {
            stringHandler: (str) => {
                return {
                    string: str
                }
            }
        }).toRawObject()
    ).toEqual({
        list: [
            {string: "1"},
            {string: "4fd0"},
            {string: "cafe"},
            {string: "hello-world"},
        ]
    })

    expect(
        JsonCbor.fromJsonValue([
            "1", "4fd0", "cafe", "hello-world"
        ],
        {
            stringHandler: JsonCbor.utils_FromJsonValueOptions.intStringHandler
        }).toRawObject()
    ).toEqual({
        list: [
            { int: 1 },
            { bytes: "4fd0"},
            { bytes: "cafe"},
            { string: "hello-world"},
        ]
    })
})

test("array become lists", () =>
{
    expect(
        JsonCbor.fromJsonValue([
            1,2,"abcdef",[]
        ]).toRawObject()
    ).toEqual({
        list: [
            {int: 1},
            {int: 2},
            {bytes: "abcdef"},
            {list: []}
        ]
    })
})

test("object become maps", () =>
{
    expect( JsonCbor.fromJsonValue({
        "hello": "world"
    }).toRawObject()
    ).toEqual({
        map: [
            {
                k: { string: "hello" },
                v: { string: "world" }
            }
        ]
    })
})
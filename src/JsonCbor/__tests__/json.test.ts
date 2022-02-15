import { JsonCborMap } from ".."

test("map json works", () => {

    expect( new JsonCborMap({
        map : [
            { 
                k: { string: "age" },
                v: { int: 18 }
            }
        ]
    }).toJsonValue() ).toEqual( { age: 18 } )

    expect( new JsonCborMap({
        map : [
            {
                k: { string: "age" },
                v: { int: 18 }
            },
            {
                k: { string: "aList" },
                v: { list: [
                        { int: 1 },
                        { int: 2 },
                        { int: 3 }
                    ]
                }
            },{
                k: { list: [
                        { int: 1 },
                        { int: 2 },
                        { int: 3 }
                    ]
                },
                v: { string: "should work" }
            },
        ]
    }).toJsonValue() ).toEqual(
        {
            age: 18,
            aList: [ 1, 2, 3 ],
            "[1,2,3]": "should work"
        }
    )
})
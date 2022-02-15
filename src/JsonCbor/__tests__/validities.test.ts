

jest.mock("@emurgo/cardano-serialization-lib-asmjs/cardano_serialization_lib.asm.js",() => jest.fn());
jest.mock("@emurgo/cardano-serialization-lib-asmjs",() => jest.fn());

test("mock", () => 
{
    expect(true).toBe(true);
})
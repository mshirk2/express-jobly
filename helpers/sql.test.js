const { BadRequestError } = require("../expressError");
const { sqlForPartialUpdate } = require("./sql");

describe("sqlForPartialUpdate", () => {

    test("works with valid data", () => {
        const dataToUpdate = {
            firstName: 'Kibo',
            age: 14
        };
        const jsToSql = {
            firstName: 'first_name'
        };
        const result = sqlForPartialUpdate(dataToUpdate, jsToSql);

        expect(result).toHaveProperty('setCols');
        expect(result).toHaveProperty('values');
        expect(result.setCols).toEqual(`"first_name"=$1, "age"=$2`);
        expect(result.values).toEqual(["Kibo", 14]);
    });

    test("works without jsToSql lookups", () =>{
        const dataToUpdate = {
            firstName: 'Kibo',
            age: 14
        };
        const jsToSql = {};
        const result = sqlForPartialUpdate(dataToUpdate, jsToSql);

        expect(result).toHaveProperty('setCols');
        expect(result).toHaveProperty('values');
        expect(result.setCols).toEqual(`"firstName"=$1, "age"=$2`);
        expect(result.values).toEqual(["Kibo", 14]);
    })

    test("throws error if no data", () => {
        const dataToUpdate = {};
        const jsToSql = {};

        expect(()=> sqlForPartialUpdate(dataToUpdate, jsToSql))
            .toThrow(BadRequestError);
    });
});
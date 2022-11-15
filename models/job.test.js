"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function (){
    const newJob = {
        title: "new title",
        salary: 30000,
        equity: 2.0,
        company_handle: "new",
    };

    test("works", async function() {
        let job = await Job.create(newJob);
        expect(job).toEqual(newJob);

        const result = await db.query(
            ``
        )
    });

})
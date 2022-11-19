"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const { update } = require("./job.js");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testJobIds,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function (){
    const newJob = {
        title: "new title",
        salary: 1000,
        equity: "0.01",
        companyHandle: "c1",
    };

    test("works", async function() {
        let job = await Job.create(newJob);
        expect(job).toEqual({
            title: "new title",
            salary: 1000,
            equity: "0.01",
            companyHandle: "c1", 
            id: expect.any(Number)});

        const result = await db.query(
            `SELECT title,
                    salary,
                    equity,
                    company_handle
            FROM jobs
            WHERE title = 'new title'`);
        expect(result.rows).toEqual([
            {
                title: "new title",
                salary: 1000,
                equity: "0.01",
                company_handle: "c1",
            },
        ]);
    });
});

/************************************** findAll */

describe("findAll", function (){
    test("works: no filter", async function(){
        let jobs = await Job.findAll();
        expect(jobs).toEqual([
            {
                id: testJobIds[0],
                title: "j1",
                salary: 10000,
                equity: '0',
                companyHandle: 'c1',
            },
            {
                id: testJobIds[1],
                title: "j2",
                salary: 20000,
                equity: "0.2",
                companyHandle: 'c2',
            },
            {
                id: testJobIds[2],
                title: "j3",
                salary: 30000,
                equity: "0.3",
                companyHandle: 'c3',
            },
        ]);
    });

    test("works: filter by title", async function(){
        let jobs = await Job.findAll({ title: 'j1' });
        expect(jobs).toEqual([
            {
                id: testJobIds[0],
                title: "j1",
                salary: 10000,
                equity: "0",
                companyHandle: 'c1',
            },
        ]);
    });

    test("works: filter by minSalary", async function(){
        let jobs = await Job.findAll({ minSalary: 25000 });
        expect(jobs).toEqual([
            {
                id: testJobIds[2],
                title: "j3",
                salary: 30000,
                equity: "0.3",
                companyHandle: 'c3',
            },
        ]);
    });

    test("works: filter by hasEquity", async function(){
        let jobs = await Job.findAll({ hasEquity: true });
        expect(jobs).toEqual([
            {
                id: testJobIds[1],
                title: "j2",
                salary: 20000,
                equity: "0.2",
                companyHandle: 'c2',
            },
            {
                id: testJobIds[2],
                title: "j3",
                salary: 30000,
                equity: "0.3",
                companyHandle: 'c3',
            },
        ]);
    });

    test("works: returns empty if no jobs found", async function(){
        let jobs = await Job.findAll({ title: 'not a title'});
        expect(jobs).toEqual([]);
    });
});

/************************************** get */

describe("get", function (){
    test("works", async function(){
        let job = await Job.get(testJobIds[0]);
        expect(job).toEqual({
            id: testJobIds[0],
            title: "j1",
            salary: 10000,
            equity: "0",
            companyHandle: 'c1',
            });
    });

    test("not found if no such job", async function(){
        try {
            await Job.get(35485);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});

/************************************** update */

describe("update", function (){
    const updateData = {
        title: 'update title',
        salary: 30,
        equity: '0.99',
    };
    
    test("works", async function(){
        let job = await Job.update(testJobIds[0], updateData);
        expect(job).toEqual({
            id: testJobIds[0],
            title: 'update title',
            salary: 30,
            equity: '0.99',
            companyHandle: 'c1',
        });
    });

    test("works: null fields", async function(){
        const updateNulls = {
            salary: null,
            equity: null,
        }
        
        let job = await Job.update(testJobIds[0], updateNulls);
        expect(job).toEqual({
            id: testJobIds[0],
            title: 'j1',
            salary: null,
            equity: null,
            companyHandle: 'c1',
        });
    });

    test("not found if no such job", async function(){
        try {
            await Job.update(35485, updateData);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });

    test("bad request with no data", async function(){
        try {
            await Job.update(testJobIds[1], {});
            fail();
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
});

/************************************** remove */

describe("remove", function (){
    test("works", async function(){
        await Job.remove(testJobIds[0]);
        const res = await db.query(
            `SELECT title
            FROM jobs 
            WHERE title = 'j1'`);
        expect(res.rows.length).toEqual(0);
    });

    test("not found if no such job", async function(){
        try {
            await Job.remove(48613555);
            fail();
          } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
          }
    });
});


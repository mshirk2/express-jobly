"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  adminToken,
  testJobIds,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
    title: "new",
    salary: 100,
    equity: '0.1',
    companyHandle: 'c1',
  };

  test("ok for admin", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
        job: {
            id: expect.any(Number),
            title: "new",
            salary: 100,
            equity: '0.1',
            companyHandle: 'c1',
        }
    });
  });

  test("unauth for non-admin", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          salary: 30,
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
            title: 101,
            salary: '100',
            equity: 85458,
            company_handle: 8,
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs:
          [
            {
                id: testJobIds[0],
                title: "j1",
                salary: 10000,
                equity: null,
                companyHandle: 'c1',
            },
            {
                id: testJobIds[1],
                title: "j2",
                salary: 20000,
                equity: '0.2',
                companyHandle: 'c2',
            },
            {
                id: testJobIds[2],
                title: "j3",
                salary: 30000,
                equity: '0.3',
                companyHandle: 'c3',
            },
          ],
    });
  });

  test("works: all filters", async () =>{
    const resp = await request(app)
      .get("/jobs")
      .query({ title: "2", minSalary: 1, hasEquity: true, });
    expect(resp.body).toEqual({
      jobs: [
        {
            id: testJobIds[1],
            title: "j2",
            salary: 20000,
            equity: '0.2',
            companyHandle: 'c2',
        },
      ],
    });
  });

  test("works: title filter", async () =>{
    const resp = await request(app)
      .get("/jobs")
      .query({ title: "1" });
    expect(resp.body).toEqual({
      jobs: [
        {
            id: testJobIds[0],
            title: "j1",
            salary: 10000,
            equity: null,
            companyHandle: 'c1',
        },
      ],
    });
  });

  test("works: minSalary filter", async () =>{
    const resp = await request(app)
      .get("/jobs")
      .query({ minSalary: 20000 });
    expect(resp.body).toEqual({
      jobs: [
        {
            id: testJobIds[1],
            title: "j2",
            salary: 20000,
            equity: '0.2',
            companyHandle: 'c2',
        },
        {
            id: testJobIds[2],
            title: "j3",
            salary: 30000,
            equity: '0.3',
            companyHandle: 'c3',
        },
      ],
    });
  });

  test("works: hasEquity filter", async () =>{
    const resp = await request(app)
      .get("/jobs")
      .query({ hasEquity: true });
    expect(resp.body).toEqual({
      jobs: [
        {
            id: testJobIds[1],
            title: "j2",
            salary: 20000,
            equity: '0.2',
            companyHandle: 'c2',
        },
        {
            id: testJobIds[2],
            title: "j3",
            salary: 30000,
            equity: '0.3',
            companyHandle: 'c3',
        },
      ],
    });
  });

  test("works: converts querystring to int", async () =>{
    const resp = await request(app)
      .get("/jobs")
      .query({ minSalary:'10', });
    expect(resp.body).toEqual({
      jobs: [
        {
            id: testJobIds[0],
            title: "j1",
            salary: 10000,
            equity: null,
            companyHandle: 'c1',
        },
        {
            id: testJobIds[1],
            title: "j2",
            salary: 20000,
            equity: '0.2',
            companyHandle: 'c2',
        },
        {
            id: testJobIds[2],
            title: "j3",
            salary: 30000,
            equity: '0.3',
            companyHandle: 'c3',
        },
      ],
    });
  });

  test("fails: throws error if invalid filter key", async () =>{
    const resp = await request(app)
      .get('/jobs')
      .query({ title: "1", bad_field: "bad field"});
    expect(resp.statusCode).toEqual(400);
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
        .get("/jobs")
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    const resp = await request(app).get(`/jobs/${testJobIds[0]}`);
    expect(resp.body).toEqual({
      job: {
        id: testJobIds[0],
        title: "j1",
        salary: 10000,
        equity: null,
        companyHandle: 'c1',
    },
    });
  });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/00000`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /jobs/:hid */

describe("PATCH /jobs/:id", function () {
  test("works for admin", async function () {
    const resp = await request(app)
        .patch(`/jobs/${testJobIds[0]}`)
        .send({
          title: "J1-new",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      job: {
        id: testJobIds[0],
        title: "J1-new",
        salary: 10000,
        equity: null,
        companyHandle: 'c1',
    },
    });
  });

  test("unauth for non-admin", async function () {
    const resp = await request(app)
        .patch(`/jobs/${testJobIds[0]}`)
        .send({
          title: "C1-new",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .patch(`/jobs/${testJobIds[0]}`)
        .send({
          title: "C1-new",
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such job", async function () {
    const resp = await request(app)
        .patch(`/jobs/00000`)
        .send({
          title: "new nope",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on handle change attempt", async function () {
    const resp = await request(app)
        .patch(`/jobs/${testJobIds[0]}`)
        .send({
          id: 681354,
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const resp = await request(app)
        .patch(`/jobs/${testJobIds[0]}`)
        .send({
          salary: "not-a-salary",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /jobs/:handle */

describe("DELETE /jobs/:id", function () {
  test("works for users", async function () {
    const resp = await request(app)
        .delete(`/jobs/${testJobIds[0]}`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({ deleted: `${testJobIds[0]}` });
  });

  test("unauth for non-admin", async function () {
    const resp = await request(app)
        .delete(`/jobs/${testJobIds[0]}`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .delete(`/jobs/${testJobIds[0]}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such job", async function () {
    const resp = await request(app)
        .delete(`/jobs/00000`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});

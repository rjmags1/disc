import { createMocks } from 'node-mocks-http'
import { createUserRoute } from '../../pages/api/createUser'
import { query } from '../../db/index'

describe('/api/createUser', () => {
    test('405 resp on non-post requests', async () => {
        const { req, res: resp } = createMocks({
            method: 'GET'
        })
        await createUserRoute(req, resp)
        expect(resp._getStatusCode()).toEqual(405)
    })

    test('400 resp on sessionless requests', async () => {
        const { req, res: resp } = createMocks({
            method: 'POST',
        })
        await createUserRoute(req, resp)
        expect(resp._getStatusCode()).toEqual(400)
    })

    test('401 resp on non admin sessions', async () => {
        const { req, res: resp } = createMocks({
            method: 'POST',
            session: {
                user: {
                    isAdmin: false
                }
            }
        })
        await createUserRoute(req, resp)
        expect(resp._getStatusCode()).toEqual(401)
    })

    test('400 resp on insufficient new user data', async () => {
        const { req, res: resp } = createMocks({
            method: 'POST',
            session: {
                user: {
                    isAdmin: true
                }
            },
            body: {
                newUser: {
                    isAdmin: false,
                    lname: "testlname",
                    email: "test@example.com",
                    avatarUrl: "http://example.com/testimage",
                    password: "2short",
                    org: "Hogwarts"
                }
            }
        })
        await createUserRoute(req, resp)
        expect(resp._getStatusCode()).toEqual(400)
    })

    test('400 resp on all supplied fields but invalid email/password', async () => {
        const { req, res: resp } = createMocks({
            method: 'POST',
            session: {
                user: {
                    isAdmin: true,
                }
            },
            body: {
                newUser: {
                    isAdmin: false,
                    fname: "testfname",
                    lname: "testlname",
                    email: "test@example.com",
                    avatarUrl: "http://example.com/testimage",
                    password: "2short",
                    org: "Hogwarts"
                }
            }
        })
        await createUserRoute(req, resp)
        expect(resp._getStatusCode()).toEqual(400)
    })

    test('200 resp on sufficient user data', async () => {
        const { req, res: resp } = createMocks({
            method: 'POST',
            session: {
                user: {
                    isAdmin: true,
                }
            },
            body: {
                newUser: {
                    isAdmin: false,
                    fname: "testfname",
                    lname: "testlname",
                    email: "test@example.com",
                    avatarUrl: "http://example.com/testimage",
                    password: "longenuff",
                    org: "Hogwarts"
                }
            }
        })
        await createUserRoute(req, resp)
        await query("DELETE FROM Person WHERE email = $1", ["test@example.com"])
        expect(resp._getStatusCode()).toEqual(200)
    })
    
    test('400 resp on all supplied fields but taken email', async () => {
        const { req: req1, res: resp1 } = createMocks({
            method: 'POST',
            session: {
                user: {
                    isAdmin: true,
                }
            },
            body: {
                newUser: {
                    isAdmin: false,
                    fname: "testfname1",
                    lname: "testlname1",
                    email: "test1@example.com",
                    avatarUrl: "http://example.com/testimage1",
                    password: "longenuff1",
                    org: "Hogwarts"
                }
            }
        })
        await createUserRoute(req1, resp1)
        expect(resp1._getStatusCode()).toEqual(200)

        const { req: req2, res: resp2 } = createMocks({
            method: 'POST',
            session: {
                user: {
                    isAdmin: true,
                }
            },
            body: {
                newUser: {
                    isAdmin: false,
                    fname: "testfname2",
                    lname: "testlname2",
                    email: "test1@example.com", // same as testfname1
                    avatarUrl: "http://example.com/testimage2",
                    password: "longenuff2",
                    org: "Hogwarts"
                }
            }
        })
        await createUserRoute(req2, resp2)
        await query("DELETE FROM Person WHERE email = $1", ["test1@example.com"])
        expect(resp2._getStatusCode()).toEqual(400)
    })

    test('200 resp -> new Person db entity row', async () => {
        const { req, res: resp } = createMocks({
            method: 'POST',
            session: {
                user: {
                    isAdmin: true,
                }
            },
            body: {
                newUser: {
                    isAdmin: false,
                    fname: "testfname",
                    lname: "testlname",
                    email: "test@example.com",
                    avatarUrl: "http://example.com/testimage",
                    password: "longenuff",
                    org: "Hogwarts"
                }
            }
        })
        await createUserRoute(req, resp)
        expect(resp._getStatusCode()).toEqual(200)
        const result = await query("SELECT * FROM Person WHERE email = $1", ["test@example.com"])
        expect(result.rows.length).toEqual(1)
        await query("DELETE FROM Person WHERE userid = $1", [result.rows[0].userid])
    })
})
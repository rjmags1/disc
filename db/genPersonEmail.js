const { faker } = require('@faker-js/faker')
const bcrypt = require('bcrypt')
const path = require('path')
require('dotenv').config({
    path: path.resolve(__dirname, '../.env.local')
})
const { Pool } = require("pg")
const pool = new Pool()

const genData = async () => {
    const admin = [ // me
        `${process.env.ADMIN_F_NAME}`, `${process.env.ADMIN_L_NAME}`,
        "TRUE", "TRUE", "TRUE",
        await createHash("rjspassword"),
        `${process.env.ADMIN_EMAIL}`
    ]

    const instructors = [ // dumbledore, mcgonagall, snape, lupin
        [
            "Albus", "Dumbledore",
            "FALSE", "FALSE", "TRUE",
            await createHash("albuspassword"),
            "albus@hogwarts.edu"
        ],
        [
            "Minerva", "Mcgonagall",
            "FALSE", "FALSE", "TRUE",
            await createHash("minervaspassword"),
            "minerva@hogwarts.edu"
        ],
        [
            "Severus", "Snape",
            "FALSE", "FALSE", "TRUE",
            await createHash("severuspassword"),
            "severus@hogwarts.edu"
        ],
        [
            "Remus", "Lupin",
            "FALSE", "FALSE", "TRUE",
            await createHash("remuspassword"),
            "remus@hogwarts.edu"
        ]

    ]

    const staff = [ // argus filch, rubeus hagrid
        [
            "Argus", "Filch",
            "FALSE", "TRUE", "FALSE",
            await createHash("arguspassword"),
            "argus@hogwarts.edu"
        ],
        [
            "Rubeus", "Hagrid",
            "FALSE", "TRUE", "FALSE",
            await createHash("rubeuspassword"),
            "rubeus@hogwarts.edu"
        ]
    ]

    const harry = [
        [
            "Harry", "Potter",
            "FALSE", "FALSE", "FALSE",
            await createHash("harryspassword"),
            "harry-potter@hogwarts.edu"
        ]
    ]

    // special case people first
    const people = [admin].concat(harry).concat(instructors).concat(staff)
    for (const person of people) {
        associateAlternateEmails(person)
    }

    // all password hashes are `${f_name}[s]password`, hashed
    // create 1 email to use as primary, later create randrange(0, 3) others
    // per person. primary emails are all @hogwarts.edu, others use faker
    for (let _ = 0; _ < 400; _++) {
        const first = faker.name.firstName()
        const last = faker.name.lastName()
        const primaryEmail = 
            `${first.toLowerCase()}-${last.toLowerCase()}@hogwarts.edu`
        const password = first[first.length - 1] === 's' ? 
            `${first}password` : `${first}spassword`
        const person = [
            first, last,
            "FALSE", "FALSE", "FALSE",
            await createHash(password),
            primaryEmail
        ]
        associateAlternateEmails(person)
        people.push(person)
    }

    for (const person of people) {        
        const [
            first, last,
            isAdmin, isStaff, isInstructor,
            passwordHash,
            primaryEmail,
            alternateEmails
        ] = person

        const emails = [primaryEmail, ...alternateEmails]
        let primaryEmailId
        for (const email of emails) {
            const emailQuery = await query(
                `INSERT INTO email (email) VALUES ($1) RETURNING email_id;`,
                [email]
            )
            if (email === primaryEmail) {
                primaryEmailId = emailQuery.rows[0].email_id
            }
        }
        
        let queryText = `INSERT INTO person (
                            f_name, 
                            l_name,
                            is_admin,
                            is_staff,
                            is_instructor,
                            password_hash,
                            primary_email)
                        VALUES (
                            $1, $2, $3, $4, $5, $6, $7)
                        RETURNING user_id;`
        let queryParams = [
            first,
            last,
            isAdmin,
            isStaff,
            isInstructor,
            passwordHash,
            primaryEmailId
        ]
        const personQuery = await query(queryText, queryParams)
        const userId = personQuery.rows[0].user_id

        queryText = `UPDATE email SET person = $1 WHERE email = $2;`
        for (const email of emails) {
            await query(queryText, [userId, email])
        }
    }

    pool.end(() => {})
}

const createHash = async function(plaintext) {
    // 8 rounds so the script doesnt take forever
    // hashing 400 passwords
    const hashed = await bcrypt.hash(plaintext, 8)
    return hashed
}

const associateAlternateEmails = function(person) {
    const [first, last, ..._] = person
    const otherEmails = []
    const numOthers = Math.floor(1 + 4 * Math.random())
    for (let _ = 0; _ < numOthers; _++) {
        const faked = faker.internet.email(first, last)
        const atIdx = faked.indexOf("@")
        const randomness = Math.floor(Math.random() * 1000).toString(10)
        const other = faked.slice(0, atIdx) + randomness + faked.slice(atIdx)
        otherEmails.push(other)
    }
    person.push(otherEmails)
}

const query = async function (queryText, queryParams) {
    try {
        const queryResult = await pool.query(queryText, queryParams)
        return queryResult
    }
    catch (error) {
        console.error(`
            QUERY ERROR: 
            query: ${queryText}\n
            error: ${error.stack}
        `)
        throw new Error("problem executing query", { cause: error })
    }
}

genData()
import { faker } from '@faker-js/faker'
import { hash } from 'bcrypt'
import { resolve, dirname } from 'path'
import dotenv from 'dotenv'
dotenv.config({ path: resolve(dirname('.'), '../.env.local') })
import * as pg from 'pg'
const client = new pg.default.Client()
await client.connect()


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
        "Harry", "Potter",
        "FALSE", "FALSE", "FALSE",
        await createHash("harryspassword"),
        "harry-potter@hogwarts.edu"
    ]

    // special case people first
    const people = [admin, harry, ...instructors, ...staff]
    for (const person of people) {
        associateAlternateEmails(person)
    }

    // all password hashes are `${f_name}[s]password`, hashed
    // create 1 email to use as primary, later create randrange(0, 3) others
    // per person. primary emails are all @hogwarts.edu, others use faker
    const nameSet = new Set()
    const emailSet = new Set()
    for (let _ = 0; _ < 500; _++) {
        const first = faker.name.firstName()
        const last = faker.name.lastName()
        const fullName = `${ first } ${ last }`
        if (fullName in nameSet) continue
        nameSet.add(fullName)

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
        let queryText = `
            INSERT INTO email (email, person) VALUES ($1, $2) RETURNING email_id;`
        let primaryEmailId
        const primaryEmailRegex = /@hogwarts.edu/
        for (const email of emails) {
            if (emailSet.has(email)) {
                if (primaryEmailRegex.test(email)) throw new Error()
                continue
            }
            emailSet.add(email)

            const emailQuery = await query(queryText, [email, null]) 
            if (email === primaryEmail) {
                primaryEmailId = emailQuery.rows[0].email_id
            }
        }
        
        queryText = `
            INSERT INTO person (
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
}

const createHash = async function(plaintext) {
    // 8 rounds so the script doesnt take forever
    // hashing 1000 passwords
    const hashed = await hash(plaintext, 8)
    return hashed
}

const associateAlternateEmails = function(person) {
    const [first, last] = person
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
        const queryResult = await client.query(queryText, queryParams)
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



try {
    await genData()
}
catch (error) {
    console.error(
        `something went wrong, most likely due to a name collision
        between faker-generated emails or person first/last names. 
        run the destroy_db shell script and try again.\n\n`)
}
finally { client.end() }
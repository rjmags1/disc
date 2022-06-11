import { clientQuery } from "../db"

const F_NAME_MAX_LEN = 20

export const genMentionNotifsInDb = (
async (client, mentions, genId, genIsPost, createdAt) => {
    const userIdFromMentionedNameQueryTextTokens = [
        `SELECT user_id FROM person WHERE `]
    const userIdQueryParams = []
    let i = 0, j = 0
    for (const [fName, lName] of mentions) {
        userIdFromMentionedNameQueryTextTokens.push(j++ < mentions.length - 1 ?
            `(f_name = $${ ++i } AND l_name = $${ ++i }) OR ` :
            `(f_name = $${ ++i } AND l_name = $${ ++i });`)
        userIdQueryParams.push(fName)
        userIdQueryParams.push(lName)
    }
    const userIdFromMentionedNameQuery = await clientQuery(
        client, userIdFromMentionedNameQueryTextTokens.join(''), 
        userIdQueryParams)
    
    const mentionedIds = userIdFromMentionedNameQuery.rows.map(r => r.user_id)
    if (mentionedIds.length === 0) return

    const genMentionNotifQueryTextTokens = [`INSERT INTO notification 
        (${ genIsPost ? 'gen_post' : 'gen_comment'}, is_mention_noti, created_at, person) 
        VALUES `]
    const genMentionNotifParams = [genId, true, createdAt]
    for (let i = 0; i < mentionedIds.length; i++) {
        genMentionNotifQueryTextTokens.push(i < mentionedIds.length - 1 ?
            `($1, $2, $3, $${ i + 4 }), ` : `($1, $2, $3, $${ i + 4 });`)
        genMentionNotifParams.push(mentionedIds[i])
    }
    try {
        await clientQuery(
            client, 
            genMentionNotifQueryTextTokens.join(''), 
            genMentionNotifParams)
    }
    catch (error) {
        console.error(error)
    }
})

export const parseForMentionTokens = (displayContent) => {
    const mentionedNames = []
    const stripped = stripAllTagsNewLines(displayContent)
    for (let i = 0; i < stripped.length - 3; i++) {
        if (stripped[i] === '@' &&
            /^[A-Za-z]{1}$/.test(stripped[i + 1])) {
            const mentionNames = getMentionName(stripped, i + 1)
            if (mentionNames === null) continue

            mentionedNames.push(mentionNames)
        }
    }
    return mentionedNames
}

const getMentionName = (s, i) => {
    const start = i
    let j = null, k = null
    while ((j === null || k === null) && i < s.length) {
        if (s[i++] === ' ') {
            if (j === null) j = i - 1
            else k = i - 1
        }
    }
    if (k === null && j !== null) k = s.length
    return (j === null || k - j > F_NAME_MAX_LEN ? 
        null : [s.slice(start, j), s.slice(j + 1, k)])
}

const stripAllTagsNewLines = s => {
    const strippedChars = []
    let i = 0
    while (i < s.length) {
        const c = s[i++]
        if (c === '<') {
            while (s[i] !== '>') i++
            i++
        }
        else if (c === '\n') continue
        else strippedChars.push(c)
    }

    return strippedChars.join('')
}
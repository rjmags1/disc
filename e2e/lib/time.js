const fixNodePgUTCTimeInterpretation = (badDateObj) => {
    const dateInfo = [
        badDateObj.getFullYear(),
        badDateObj.getMonth(),
        badDateObj.getDate(),
        badDateObj.getHours(),
        badDateObj.getMinutes(),
        badDateObj.getSeconds(),
        badDateObj.getMilliseconds()
    ]

    return new Date(Date.UTC(...dateInfo))
}


const toTimestampString = (createdAt) => {
    // now would just be new Date(Date.now()) in real scenario
    const now = new Date(new Date(Date.UTC(2003, 11, 31, 23, 59, 30)))
    const yearDiff = now.getUTCFullYear() - createdAt.getUTCFullYear()
    if (yearDiff) {
        return `${ yearDiff } year${ yearDiff > 1 ? "s" : "" } ago`
    }
    const monthDiff = now.getUTCMonth() - createdAt.getUTCMonth()
    if (monthDiff) {
        return `${ monthDiff } month${ monthDiff > 1 ? "s" : ""} ago`
    }

    const dayDiff = now.getUTCDate() - createdAt.getUTCDate()
    const hourDiff = now.getUTCHours() - createdAt.getUTCHours()
    if (dayDiff > 1 || (dayDiff && (24 + hourDiff) > 24)) {
        return `${ dayDiff } day${ dayDiff > 1 ? "s" : "" } ago`
    }
    else if (hourDiff) {
        return `${ hourDiff } hour${ hourDiff > 1 ? "s" : "" } ago`
    }
    const minuteDiff = now.getUTCMinutes() - createdAt.getUTCMinutes()
    return `${ minuteDiff } minute${ minuteDiff > 1 ? "s" : "" } ago`
}

module.exports = {
    fixNodePgUTCTimeInterpretation,
    toTimestampString
}
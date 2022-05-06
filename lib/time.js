export const fixNodePgUTCTimeInterpretation = (badDateObj) => {
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
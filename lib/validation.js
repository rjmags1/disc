export const validEmail = function(email) {
    const lastAtIdx = email.lastIndexOf('@')
    const prefixLength = lastAtIdx
    const suffixLength = email.length - prefixLength - 1
    const lastDotIdx = email.lastIndexOf('.')
    const validEmail = (
        lastAtIdx < lastDotIdx
        && lastAtIdx > 0 
        && email.indexOf('@@') == -1 
        && lastDotIdx > 2 
        && (email.length - lastDotIdx) > 2
        && prefixLength <= 64
        && suffixLength <= 255
    )
    return validEmail
}

export const validPassword = function(password) {
    const validLength = password.length >= 8 && password.length <= 64
    const validChars = password.match(/^[ !"#$%&'()*+,-.\/:;<=>?@[\]^_`{|}~a-zA-Z0-9]*$/)
    return validLength && validChars
}

export const clientSideLoginValidator = function(email, password) {
    return validEmail(email) && validPassword(password)
}
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
    const re = /^[ !"#$%&'()*+,-.\/:;<=>?@[\]^_`{|}~a-zA-Z0-9]*$/
    const validChars = re.test(password)
    return validLength && validChars
}

export const validOrg = org => /^[A-Za-z]*$/.test(org)

export const loginValidator = function(email, password, org) {
    return validEmail(email) && validPassword(password) && validOrg(org)
}

export const formatOrgForDb = org => {
    return org.slice(0, 1).toUpperCase() + org.slice(1).toLowerCase()
}
import { validEmail, validPassword, validOrg } from "../../lib/validation"

const MAX_EMAIL_SUFFIX_LENGTH = 255
const MAX_EMAIL_PREFIX_LENGTH = 64

describe('email validation', () => {
    test('reject @ in server name', () => {
        expect(validEmail("testuser@valid-subdom@in.@invalid-domain")).
            toEqual(false)
    })


    test('reject no @ in email', () => {
        expect(validEmail("testuserattest-domain.com")).toEqual(false)
    })


    test('reject @@ in email', () => {
        expect(validEmail("testuser@@test-domain.com")).toEqual(false)
    })


    test('reject empty email prefix', () => {
        expect(validEmail("@test.com")).toEqual(false)
    })


    test('reject domain <2 chars', () => {
        expect(validEmail("test@valid-subdomain.t")).toEqual(false)
    })


    test('reject excessive prefix length', () => {
        const excessivePrefix = "prefix".repeat(
            Math.floor(MAX_EMAIL_PREFIX_LENGTH / 6) + 1)
        const excessivePrefixEmail = excessivePrefix + "@validSuffix.com"

        expect(validEmail(excessivePrefixEmail)).toEqual(false)
    })


    test('reject excessive suffix length', () => {
        const excessiveSuffix = "suffix".repeat(
            Math.floor(MAX_EMAIL_SUFFIX_LENGTH / 6) + 1)
        const excessiveSuffixEmail = "validPrefix@" + excessiveSuffix

        expect(validEmail(excessiveSuffixEmail)).toEqual(false)
    })

    test('dont reject valid email', () => {
        expect(validEmail("test-user@valid-email.com")).toEqual(true)
    })
})


describe('password validation', () => {
    test('reject invalid password length', () => {
        expect(validPassword("2shortt")).toEqual(false)
    })


    test('dont reject valid password', () => {
        expect(validPassword("longenuff")).toEqual(true)
    })
})


describe('org validation', () => {
    test('reject non alpha org input', () => {
        expect(validOrg("asdf1234!@#$")).toEqual(false)
    })


    test('accept alpha org input', () => {
        expect(validOrg("asdfASDF")).toEqual(true)
    })
})
exports.TESTUSER_REGISTERED = {
    userId: 8,
    email: "john-doe@hogwarts.edu",
    password: "johnspassword",
    organization: "Hogwarts",
    allEmails: [
        "john-doe@hogwarts.edu", 
        "john@gmail.com", 
        "john@yahoo.com"
    ]
}

exports.TESTUSER_UNREGISTERED = {
    email: "unregtest@test.com",
    password: "unregtestpassword",
    organization: "unregtest"
}

exports.login = async function(page, user) {
    await page.goto('/login');
    await page.locator('#organization-input').fill(user.organization)
    await page.locator('#email-input').fill(user.email)
    await page.locator('#password-input').fill(user.password)
    await Promise.all([
        page.waitForNavigation({ url: '/' }),
        page.locator('#full-login-submit-button').click()
    ]);
}

exports.emailLogin = async function(page, user) {
    await page.goto('/login')
    await page.locator('#organization-input').fill(user.organization)
    await page.locator('#email-input').fill(user.email)
    await page.locator('text=Email Me Login Link').click()
}
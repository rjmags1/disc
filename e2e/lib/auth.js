exports.TESTUSER_REGISTERED = {
    email: "john-doe@hogwarts.edu",
    password: "johnspassword",
    organization: "Hogwarts"
}

exports.TESTUSER_UNREGISTERED = {
    email: "unregtest@test.com",
    password: "unregtestpassword",
    organization: "unregtest"
}

exports.login = async function(page, user) {
    await page.goto('/login');
    await page.locator('id=organization-input').fill(user.organization)
    await page.locator('id=email-input').fill(user.email)
    await page.locator('id=password-input').fill(user.password)
    await Promise.all([
        page.waitForNavigation({ url: '/' }),
        page.locator('text=Submit').click()
    ]);
}

exports.emailLogin = async function(page, user) {
    await page.goto('/login')
    await page.locator('[id=organization-input]').fill(user.organization)
    await page.locator('[id=email-input]').fill(user.email)
    await page.locator('text=Email Me Login Link').click()
}
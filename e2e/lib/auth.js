exports.TESTUSER_REGISTERED = {
    userId: 2,
    fullName: "Harry Potter",
    email: "harry-potter@hogwarts.edu",
    password: "harryspassword",
    organization: "Hogwarts",
}

exports.TESTUSER_STAFF = {
    userId: 3,
    fullName: "Albus Dumbledore",
    email: "albus@hogwarts.edu",
    password: "albuspassword",
    organization: "Hogwarts"
}

exports.TESTUSER_ADMIN = {
    userId: 1,
    fullName: `${process.env.ADMIN_F_NAME} ${process.env.ADMIN_L_NAME}`,
    email: `${process.env.ADMIN_EMAIL}`,
    password: "rjspassword",
    organization: "Hogwarts"
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
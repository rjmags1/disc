const { devices } =  require('@playwright/test')

const config = {
    timeout: 5 * 1000,
    retries: 0,
    testDir: './e2e',
    globalSetup: './e2e.setup.js',

    webServer: {
        command: 'npm run dev',
        port: 3000,
        timeout: 120 * 1000,
        reuseExistingServer: !process.env.CI,
    },

    use: { trace: 'retry-with-trace', },

    projects: [
    {
        name: 'Desktop Chrome',
        use: { ...devices['Desktop Chrome'], },
    },
    {
        name: 'Desktop Firefox',
        use: { ...devices['Desktop Firefox'], },
    },
    {
        name: 'Desktop Safari',
        use: { ...devices['Desktop Safari'], },
    },
    {
        name: 'Mobile Chrome',
        use: { ...devices['Pixel 5'], },
    },
    {
        name: 'Mobile Safari',
        use: devices['iPhone 12'],
    },
    ],
}

module.exports = config
const path = require('path')

module.exports = async () => {
    require('dotenv').config({
        path: path.resolve(__dirname, './.env.e2e')
    })
}
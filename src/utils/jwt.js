const jwt = require('jsonwebtoken')

const PRIVATE_KEY = 'kasdbn19221312310edawqdq'

module.exports = {
    secret:'kasdbn19221312310edawqdq',

    generateToken: user => {
        const token = jwt.sign({ user }, PRIVATE_KEY, { expiresIn: '24h' })
        return token
    },
    authToken: (req, res, next) => {
        const authHeader = req.headers.authorization
        if (!authHeader) {
            return res.status(401).send({ error: "Not authenticated" })
        }
        const [, token] = authHeader.split(' ')
        jwt.verify(token, PRIVATE_KEY, (error, credentials) => {
            if (error) {
                return res.status(403).send({ error: "Not authorized" })
            }
            req.user = credentials.user
            next()
        })
    }
}



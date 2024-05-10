const passport = require('passport')
const local = require('passport-local')
const { User } = require('../dao/models')
const { createHash, isValidPassword } = require('../utils/utils')
const GitHubStrategy = require('passport-github2')
const { clientID, clientSecret, callbackURL } = require('./github.private')
const CartManager = require('../dao/DBModules/cartManager')
const { Strategy, ExtractJwt } = require('passport-jwt')
const { secret } = require('../utils/jwt')



const LocalStrategy = local.Strategy

const cookieExtractor = req => req && req.cookies ? req.cookies['accessToken']: null

const initializePassport = () => {

    passport.use('jwt', new Strategy({
        jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
        secretOrKey: secret

    }, async (jwt_payload, done) =>{
        try{
            return done(null,jwt_payload)

        }
        catch(err){
            return done(Err)
        }
    }))

    passport.use('github', new GitHubStrategy({
        clientID,
        clientSecret,
        callbackURL
    }, async (_accessToken, _refreshToken, profile, done) => {
        try {
            console.log('profile GitHub: ' + profile)
            const user = await User.findOne({ email: profile._json.email })
            if (user) {
                return done(null, user)
            }
            const fullName = profile._json.name
            const first_name = fullName.substring(0, fullName.lastIndexOf(' '))
            const last_name = fullName.substring(fullName.lastIndexOf(' ') + 1)
            const newUser = {
                first_name,
                last_name,
                age: 30,
                email: profile._json.emails,
                password: '',
                cart: async () => {
                    await fetch(`/api/carts/`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        }
                    })
                },
                role
            }
            const result = await User.create(newUser)
            done(null, result)
        }
        catch (err) {
            return done(err)

        }
    }))

    passport.use('register', new LocalStrategy(
        { passReqToCallback: true, usernameField: 'email' }, async (req, username, password, done) => {
            const { first_name, last_name, email, age } = req.body
            try {
                const user = await User.findOne({ email: username })
                const cartManager = new CartManager()
                const newCart = await cartManager.addCart()
                

                if (user) {
                    console.log("user Already exists")
                    return done(null, false)
                }
                const newUser = {
                    first_name,
                    last_name,
                    email,
                    age,
                    password: createHash(password),
                    cart: newCart._id


                }
                const result = await User.create(newUser)
                return done(null, result)

            }
            catch (err) {
                return done("error al registrar el usuario: " + err)

            }
        }
    ))
    passport.use('login', new LocalStrategy({ usernameField: 'email' }, async (username, password, done) => {
        try {
            const user = await User.findOne({ email: username })
            if (!user) {
                console.log("User doesn't exist")
                return done(null, false)
            }
            if (!isValidPassword(user, password)) {
                return done(null, false)
            } else {
                return done(null, user)
            }
        }
        catch (err) {
            return done(err)

        }
    }))

    passport.serializeUser(async (user, done) => {
        done(null, user._id)
    })
    passport.deserializeUser(async (id, done) => {
        const user = await User.findById(id)
        done(null, user)
    })

}

module.exports = initializePassport
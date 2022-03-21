export const sessionOptions = {
    password: process.env.SECRET_COOKIE_PASSWORD,
    cookieName: "session",
    cookieOptions: {
        secure: process.env.NODE_ENV === "production",
        maxAge: undefined // expire session on browser close
    }
}
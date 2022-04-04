import { useState } from 'react'
import { useOrgs, useUser } from '../../lib/hooks'
import { loginValidator, validEmail, validOrg } from '../../lib/validation'

import LoginDatalist from './LoginDatalist'
import LoginTextInput from './LoginTextInput'
import InvalidLoginMessage from './InvalidLoginMessage'

function LoginForm() {
    const [org, setOrg] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showInvalidMessage, setInvalidMessage] = useState(false)

    const { orgs } = useOrgs()
    const { mutateUser } = useUser({ redirectTo: '/', redirectIfFound: true })

    const handleNormalLogin = async function(event) {
        event.preventDefault()
        const valid = loginValidator(email, password, org)
        if (!valid) {
            setInvalidMessage(true)
            return
        }

        const body = {
            email: email,
            password: password,
            org: org
        }
        try {
            mutateUser(async () => {
                const resp = await fetch("/api/login", {
                    method: 'POST',
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body)
                })
                if (!resp.ok) setInvalidMessage(true)
                else setInvalidMessage(false)
                return resp
            })
        }
        catch (error) {
            console.error(error)
            alert("there was a problem verifying your credentials. try again")
        }
    }

    const handleEmailLogin = async function() {
        if (!validEmail(email) || !validOrg(org)) {
            setInvalidMessage(true)
            return
        }
        
        const body = {
            email: email,
            org: org
        }
        try {
            const resp = await fetch("/api/sendMagicLink", {
                method: 'POST',
                headers: { "Content-Type" : "application/json" },
                body: JSON.stringify(body)
            })
            if (resp.status !== 200) {
                setInvalidMessage(true)
                return
            }
            setInvalidMessage(false)
            alert("check your email!")
        }
        catch (error) {
            console.error(error)
            setInvalidMessage(true)
        }
    }

    const orgNames = orgs ? Object.entries(orgs).map(([_, v]) => v.name) : []
    const emailInputAttributes = {
        label: "Email:",
        inputId: "email-input",
        containerTestId: "text-input-container-test-email"
    }
    const passwordInputAttributes = {
        label: "Password:",
        inputId: "password-input",
        containerTestId: "text-input-container-test-password"
    }
    const forgotPasswordText = `
        Forgot password? Just enter org + email
        and click the gray button for email sign-in.
        Login links expire after 5 minutes.
        `

    return (
        <div data-testid="login-form-container" className="w-60 sm:w-96">
            { showInvalidMessage && <InvalidLoginMessage />}
            <form onSubmit={ handleNormalLogin }
                name="login-form" className="mt-3">
                <LoginDatalist label="Organization:" optionValues={ orgNames }
                    handleChange={ e => setOrg(e.target.value) } />
                <LoginTextInput attributes={ emailInputAttributes } 
                    handleChange={ e => setEmail(e.target.value) } />
                <LoginTextInput attributes={ passwordInputAttributes } blur
                    handleChange={ e => setPassword(e.target.value) } />
                <input type="submit" value="Submit" 
                    className="w-full bg-purple rounded-md h-12 mt-7 
                    hover:bg-violet-600 hover:cursor-pointer"/>
            </form>
            <div>
                <button type="button" className="mt-7 p-3 bg-slate-600 
                    rounded-md hover:bg-gray-700 h-12 w-full" 
                    id="full-login-submit-input" onClick={ handleEmailLogin }>
                    Email Me Login Link
                </button>
                <p className="text-xs mt-1">
                    <i>{ forgotPasswordText }</i>
                </p>
            </div>
        </div>
    )
}

export default LoginForm
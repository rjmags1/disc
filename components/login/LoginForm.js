import { useState } from 'react'
import { useOrgs, useUser } from '../../lib/hooks'
import { loginValidator, validEmail, validOrg } from '../../lib/validation'
import ButtonLoading from '../lib/ButtonLoading'

import LoginDatalist from './LoginDatalist'
import LoginTextInput from './LoginTextInput'
import InvalidLoginMessage from './InvalidLoginMessage'

function LoginForm() {
    const [org, setOrg] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showInvalidMessage, setInvalidMessage] = useState(false)
    const [failedAttempts, setFailedAttempts] = useState(0)
    const [processingNormalLogin, setProcessingNormalLogin] = useState(false)
    const [processingEmailLogin, setProcessingEmailLogin] = useState(false)

    const { orgs, loading: loadingOrgs } = useOrgs()
    const { mutateUser } = useUser({ redirectTo: '/', redirectIfFound: true })

    const handleNormalLogin = async function(event) {
        event.preventDefault()
        const valid = loginValidator(email, password, org)
        if (!valid) {
            setFailedAttempts(failedAttempts + 1)
            setInvalidMessage(true)
            return
        }

        setProcessingNormalLogin(true)
        setInvalidMessage(false)
        document.getElementById("full-login-submit-button").disabled = true
        const body = {
            email: email,
            password: password,
            org: org
        }
        try {
            mutateUser(async () => {
                const resp = await fetch("/api/auth/login", {
                    method: 'POST',
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body)
                })
                if (!resp.ok) {
                    setFailedAttempts(failedAttempts + 1)
                    setInvalidMessage(true)
                }
                else setInvalidMessage(false)
                return resp
            })
        }
        catch (error) {
            console.error(error)
            alert("there was a problem verifying your credentials. try again")
        }
        finally {
            document.getElementById("full-login-submit-button").disabled = false
            setProcessingNormalLogin(false)
        }
    }

    const handleEmailLogin = async function() {
        if (!validEmail(email) || !validOrg(org)) {
            setFailedAttempts(failedAttempts + 1)
            setInvalidMessage(true)
            return
        }
        
        setProcessingEmailLogin(true)
        setInvalidMessage(false)
        document.getElementById("email-login-submit-button").disabled = true
        const body = {
            email: email,
            org: org
        }
        try {
            const resp = await fetch("/api/auth/sendMagicLink", {
                method: 'POST',
                headers: { "Content-Type" : "application/json" },
                body: JSON.stringify(body)
            })
            if (resp.status !== 200) {
                setFailedAttempts(failedAttempts + 1)
                setInvalidMessage(true)
                return
            }
            setInvalidMessage(false)
            setProcessingEmailLogin(false)
            alert("check your email!")
        }
        catch (error) {
            console.error(error)
            setFailedAttempts(failedAttempts + 1)
            setInvalidMessage(true)
        }
        finally {
            document.getElementById("email-login-submit-button").disabled = false
            setProcessingEmailLogin(false)
        }
    }

    const orgNames = loadingOrgs ? [] : orgs
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
        Emailed login links expire after 5 minutes.
        `

    return (
        <div data-testid="login-form-container" className="w-60 sm:w-96">
            { showInvalidMessage && 
            <InvalidLoginMessage failedAttempts={ failedAttempts } />}
            <div className="mt-3">
                <LoginDatalist label="Organization:" optionValues={ orgNames }
                    handleChange={ e => setOrg(e.target.value) } />
                <LoginTextInput attributes={ emailInputAttributes } 
                    handleChange={ e => setEmail(e.target.value) } />
                <LoginTextInput attributes={ passwordInputAttributes } blur
                    handleChange={ e => setPassword(e.target.value) } />
                <button type="button" onClick={ handleNormalLogin }
                    id="full-login-submit-button"
                    className="w-full bg-purple rounded-md h-12 mt-7 
                    hover:bg-violet-600 hover:cursor-pointer" >
                    { processingNormalLogin ? 
                    <span className='flex justify-center items-center'>
                        Processing...<ButtonLoading />
                    </span>  
                    : 
                    "Login" }
                </button>
            </div>
            <div>
                <button type="button" className="mt-7 p-3 bg-slate-600 
                    rounded-md hover:bg-gray-700 h-12 w-full" 
                    id="email-login-submit-button" onClick={ handleEmailLogin }>
                    { processingEmailLogin ? 
                    <span className='flex justify-center items-center'>
                        Processing...<ButtonLoading />
                    </span>  
                    : 
                    "Email Me Login Link" }
                </button>
                <p className="text-xs mt-1">
                    <i>{ forgotPasswordText }</i>
                </p>
            </div>
        </div>
    )
}

export default LoginForm
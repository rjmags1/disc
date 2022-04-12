import { useState, useEffect } from 'react'
import { useOrgs, useUser } from '../../lib/hooks'
import { validLoginInfo, validEmail, validOrg } from '../../lib/validation'

import NormalLoginButton from './NormalLoginButton'
import EmailLoginButton from './EmailLoginButton'
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
    const [processing, setProcessing] = useState(false)
    const [throttle, setThrottle] = useState(null)

    const { orgs, loading: loadingOrgs } = useOrgs()
    const { mutateUser } = useUser({ redirectTo: '/', redirectIfFound: true })

    useEffect(() => () => { if (throttle) clearTimeout(throttle) })

    const handleNormalLogin = async function(event) {
        event.preventDefault()
        if (!validLoginInfo(email, password, org)) {
            setFailedAttempts(failedAttempts + 1)
            setInvalidMessage(true)
            return
        }

        setProcessingNormalLogin(true)
        setProcessing(true)
        setInvalidMessage(false)
        const body = {
            email: email,
            password: password,
            org: org
        }
        try {
            mutateUser(async () => {
                const resp = await fetch("/api/auth/login", {
                    method: 'PUT',
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
            setProcessing(false)
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
        setProcessing(true)
        setInvalidMessage(false)
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

            const throttleTimer = setTimeout(() => { 
                setThrottle(false) 
            }, 2 * 60 * 1000)
            setThrottle(throttleTimer) // front end throttle email login button
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
            setProcessing(false)
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
                <NormalLoginButton handleClick={ handleNormalLogin } 
                    processing={ processing } 
                    processingNormal={ processingNormalLogin } />
            </div>
            <div>
                <EmailLoginButton handleClick={ handleEmailLogin }
                    processing={ processing } throttle={ throttle }
                    processingEmail={ processingEmailLogin } />
                <p className="text-xs mt-1">
                    <i>{ forgotPasswordText }</i>
                </p>
            </div>
        </div>
    )
}

export default LoginForm
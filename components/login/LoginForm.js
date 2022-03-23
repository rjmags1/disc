import { useState } from 'react'
import { useOrgs, useUser } from '../../lib/hooks'
import { clientSideLoginValidator } from '../../lib/validation'

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

    const handleSubmit = async function(event) {
        event.preventDefault()
        const valid = clientSideLoginValidator(email, password)
        if (!valid) {
            setInvalidMessage(true)
            return
        }

        setInvalidMessage(false)
        const body = {
            credentials: {
                email: email,
                password: password
            }
        }
        try {
            mutateUser(async () => {
                await fetch("/api/login", {
                    method: 'POST',
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body)
                })
            })
        }
        catch (error) {
            console.error(error)
            alert("we had a problem verifying your credentials. check the console/your connection")
        }
    }

    const orgNames = orgs ? Object.entries(orgs).map(([k, v]) => v.name) : []
    const orgsDlInfo = {
        containerTestId: "datalist-container-test",
        inputId: "organization",
        label: "Organization:",
        datalistId: "organizations",
        datalistTestId: "datalist-datalist-test"
    }
    const emailTextInputInfo = {
        label: "Email:",
        inputId: "email-input",
        containerTestId: "text-input-container-test-email"
    }
    const passTextInputInfo = {
        label: "Password:",
        inputId: "password-input",
        containerTestId: "text-input-container-test-password"
    }

    return (
        <div data-testid="login-form-container" className="w-60 sm:w-80">
            { showInvalidMessage && <InvalidLoginMessage />}
            <form onSubmit={ handleSubmit } name="login-form" className="mt-3">
                <LoginDatalist info={ orgsDlInfo } optionValues={ orgNames }
                    handleChange={ e => setOrg(e.target.value) } />
                <LoginTextInput info={ emailTextInputInfo } 
                    handleChange={ e => setEmail(e.target.value) } />
                <LoginTextInput info={ passTextInputInfo } blur
                    handleChange={ e => setPassword(e.target.value) } />
                <input type="submit" value="Submit" 
                    className="w-full bg-bright-blue rounded-md h-12 mt-4 hover:bg-sky-700"/>
            </form>
        </div>
    )
}

export default LoginForm
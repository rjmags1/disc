import { useState } from 'react'
import { useOrgs } from '../../lib/hooks'

import LoginDatalist from './LoginDatalist'
import LoginTextInput from './LoginTextInput'

function LoginForm({ validate }) {
    const [org, setOrg] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    const { orgs } = useOrgs()

    const handleSubmit = e => {
        e.preventDefault()
        if (org === "" || email === "" || password === "") return
        const passesClientSideValidation = validate(email, password)
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
        <form onSubmit={ handleSubmit } name="login-form" className="mt-3">
            <LoginDatalist info={ orgsDlInfo } optionValues={ orgNames }
                handleChange={ e => setOrg(e.target.value) } />
            <LoginTextInput info={ emailTextInputInfo } 
                handleChange={ e => setEmail(e.target.value) } />
            <LoginTextInput info={ passTextInputInfo } 
                handleChange={ e => setPassword(e.target.value) } />
            <input type="submit" value="Submit" 
                className="w-full bg-bright-blue rounded-md h-12 mt-4 hover:bg-sky-700"/>
        </form>
    )
}

export default LoginForm
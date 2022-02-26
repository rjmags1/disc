import { useState } from 'react'

import Datalist from './Datalist'
import TextInput from './TextInput'

function LoginForm({ validate }) {
    const [org, setOrg] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    // TODO: ssg optionsValues
    const handleSubmit = e => {
        e.preventDefault()
        // TODO: decide if html required feedback is sufficient for empty field
        if (org === "" || email === "" || password === "") return
        // check that org is in optionsValues
        const passesClientSideValidation = validate(email, password)
        // if (passesClientSideValidation) {
            // const passesServerSideValidation = authApiCall()
            // if (passesServerSideValidation) doRedirect()
            // else notifyUnauthorizedCredentials()
        // }
        // else {
            // notifyInvalidInput()
        // }
    }

    const orgsDlInfo = {
        optionValues: [],
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
        <form onSubmit={ handleSubmit } name="login-form">
            <Datalist info={ orgsDlInfo }
                handleChange={ e => setOrg(e.target.value) } />
            <TextInput info={ emailTextInputInfo } 
                handleChange={ e => setEmail(e.target.value) } />
            <TextInput info={ passTextInputInfo } 
                handleChange={ e => setPassword(e.target.value) } />
            <input type="submit" value="Submit" />
        </form>
    )
}

export default LoginForm
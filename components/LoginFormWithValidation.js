import { useState } from 'react'

import LoginForm from "./LoginForm"
import InvalidLoginMessage from './InvalidLoginMessage'

function LoginFormWithValidation() {
    const [showInvalidMessage, setInvalidMessage] = useState(false)
    const emailPasswordValidator = (email, password) => {
        const lastAtIdx = email.lastIndexOf('@')
        const prefixLength = lastAtIdx
        const suffixLength = email.length - prefixLength - 1
        const lastDotIdx = email.lastIndexOf('.')
        const validEmail = (
            lastAtIdx < lastDotIdx
            && lastAtIdx > 0 
            && email.indexOf('@@') == -1 
            && lastDotIdx > 2 
            && (email.length - lastDotIdx) > 2
            && prefixLength <= 64
            && suffixLength <= 255
        )
        const validPassword = password.length >= 8 && password.length <= 64
        if (!validEmail || !validPassword) setInvalidMessage(true)
        return validEmail && validPassword
    }

    return (
        <div data-testid="login-form-val-container">
            { showInvalidMessage && <InvalidLoginMessage />}
            <LoginForm validate={ emailPasswordValidator }/>
        </div>
    )
}

export default LoginFormWithValidation
import LoginFormWithValidation from "../components/LoginFormWithValidation"
import Image from 'next/image'

function Login() {
    return (
        <div data-testid="login-page-container">
            <Image src="/logo.png" alt="disc-logo" width="80" height="80"/>
            <LoginFormWithValidation />
        </div>
    )
}

export default Login
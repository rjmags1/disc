import LoginFormWithValidation from "../components/login/LoginFormWithValidation"
import Image from 'next/image'
import { useUser } from '../lib/hooks'

function Login() {
    const { user } = useUser({ redirectTo: '/', redirectIfFound: true })

    return (
        <div data-testid="login-page-container" 
            className="w-screen h-screen flex justify-center
                items-center flex-col bg-bluish-gray text-white">
            <Image src="/logo.png" alt="disc-logo" width="110" height="110"/>
            <LoginFormWithValidation />
        </div>
    )
}

export default Login
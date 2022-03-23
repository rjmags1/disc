import LoginForm from "../components/login/LoginForm"
import Image from 'next/image'
import { useUser } from '../lib/hooks'
import Loading from '../components/lib/Loading'
import Head from 'next/head'

function Login() {
    const { loadingUserFromCache, user } = useUser({ redirectTo: "/", redirectIfFound: true })

    if (loadingUserFromCache || user.authenticated) return <Loading />
    return (
        <div data-testid="login-page-container"
            className="w-screen h-screen flex justify-center
                items-center flex-col bg-bluish-gray text-white">
            <Head>
                <title>Login</title>
            </Head>
            <Image src="/logo.png" alt="disc-logo" width="110" height="110"/>
            <LoginForm />
        </div>
    )
}

export default Login
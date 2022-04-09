import LoginForm from "../components/login/LoginForm"
import { useUser } from '../lib/hooks'
import Loading from '../components/lib/Loading'
import Head from 'next/head'

function Login() {
    const {
        loading: loadingUser, 
        user
    } = useUser({ redirectTo: "/", redirectIfFound: true })

    if (loadingUser || user.authenticated) return <Loading />
    return (
        <div data-testid="login-page-container"
            className="w-screen h-screen flex justify-center
                items-center flex-col bg-zinc-900 text-white">
            <Head>
                <title>Login</title>
            </Head>
            <h1 className="text-white font-mono text-7xl mb-8">
                <em><b>disc</b></em>
            </h1>
            <LoginForm />
        </div>
    )
}

export default Login
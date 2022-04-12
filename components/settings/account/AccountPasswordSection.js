import { useState, useEffect } from 'react'

function AccountPasswordSection() {
    const [throttle, setThrottle] = useState(null)

    // cancel throttle timer in cleanup function
    useEffect(() => () => { if (throttle) clearTimeout(throttle) })

    const handleClick = async function() {
        try {
            const resp = await fetch("/api/settings/sendPasswordReset", {
                method: 'PUT'
            })
            if (resp.ok) {
                // front-end throttle for 2 min
                const timer = setTimeout(
                    () => { setThrottle(false) }, 2 * 60 * 1000) 
                setThrottle(timer)
                alert(`We sent a reset password link to your primary email!`)
            }
        }
        catch (error) {
            setThrottle(null)
            alert("check your connection!")
        }
    }

    const emailPasswordResetMsg = `
        Click to have a reset password email sent to your primary email.`
    const unthrottledStyles = `mt-2 bg-red-600 border border-white rounded
                                p-1 hover:cursor-pointer hover:bg-black px-4`
    const throttledStyles = `mt-2 border border-white rounded p-1 bg-slate-500
                                hover:bg-slate-500 hover:cursor-not-allowed px-4`

    return (
        <div data-testid="account-password-section-container"
            className="mt-10">
            <div className="ml-4">
                <h2 className="text-2xl mb-1">Password</h2>
                <button onClick={ handleClick } 
                    disabled={ throttle }
                    className={ throttle ? 
                        throttledStyles : unthrottledStyles }>
                    Reset Password
                </button>
                <p className="text-sm mt-2">
                    { emailPasswordResetMsg }
                </p>
            </div>
        </div>
    )
}

export default AccountPasswordSection
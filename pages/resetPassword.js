import { useUser } from '../lib/hooks'
import { useState, useEffect } from 'react'
import { validPassword } from '../lib/validation'
import { useRouter } from 'next/router'

function ResetPassword() {
    const [newPassword, setNewPassword] = useState("")
    const [confirmNewPassword, setConfirmNewPassword] = useState("")
    const [invalid, setInvalid] = useState(false)

    const { mutateUser } = useUser({ redirectTo: "/login" })

    const router = useRouter()
    useEffect(() => {
        const url = window.location.href
        if (url.search("seal") == -1) router.push("/")
    })

    const handleSubmit = async (event) => {
        event.preventDefault()
        if (newPassword !== confirmNewPassword || 
            !validPassword(newPassword)) {
            setInvalid(true)
            return
        }

        try {
            const url = window.location.href
            const seal = url.slice(url.search("seal") + "seal=".length)
            const resp = await fetch('/api/settings/resetPassword', {
                method: 'PUT',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    newPassword: newPassword,
                    seal: seal
                })
            })
            if (resp.ok) {
                mutateUser()
                setInvalid(false)
            }
            else alert(`do not attempt to reset password 
                        outside of account settings page`)
        }
        catch (error) {
            console.error(error.message)
        }
    }

    const invalidMsg = `
        Your input passwords don't match, or they are invalid. Valid 
        passwords are between 8-64 characters and cannot contain certain
        non-alphanumeric characters.`

    return (
        <div data-testid="reset-password-form-container"
            className="flex justify-center items-center w-full h-full bg-zinc-900">
            <form onSubmit={ handleSubmit } name="reset-password-form"
                className="w-1/3 max-w-sm">
                <label className="w-full block text-white">
                    New Password:
                    <input type="password" value={ newPassword } 
                        className="block text-black rounded w-full h-10 p-2"
                        onChange={ e => { setNewPassword(e.target.value) } } />
                </label>
                <label className="w-full block text-white mt-6">
                    Confirm New Password:
                    <input type="password" value={ confirmNewPassword } 
                        className="block text-black rounded w-full h-10 p-2"
                        onChange={ e => { 
                            setConfirmNewPassword(e.target.value) } } />
                </label>
                <input type="submit" value="Submit" 
                        className="w-full text-white mt-6 bg-purple h-12 rounded"/>
                { invalid && 
                <p className="text-white w-full mt-4">
                    { invalidMsg }
                </p> }
            </form>
        </div>
    )
}

export default ResetPassword
import { useRouter } from 'next/router'
import { useUser } from '../../lib/hooks'

function ProfileDropdownButton({ label, last, href }) {
    const router = useRouter()
    const { 
        loading: loadingUser, 
        mutateUser 
    } = useUser({ redirectTo: '/login' })

    const handleClick = async function(event) {
        event.preventDefault()
        if (loadingUser) return

        if (/logout/gi.test(href)) {
            // destroy session cookie
            try {
                await fetch("/api/auth/logout", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" }
                })
                // cast revalidation message on user data hook 
                mutateUser()
            }
            catch (error) {
                console.error(error)
                alert("problem logging you out. check your connection")
            }
        }
        else router.push(href)
    }

    const baseStyles = "w-full hover:bg-violet-500 px-4 py-1"
    const styles = last ? baseStyles + " rounded-b-md" : baseStyles
    return (
        <div data-testid="profile-dropdown-button-container"
            className={ styles } onClick={ handleClick }>
            <button>{ label }</button>
        </div>
    )
}

export default ProfileDropdownButton
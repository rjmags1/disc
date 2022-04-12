import { useRouter } from 'next/router'
import { useUser } from '../../lib/hooks'

function ProfileDropdownButton({ label, last, href }) {
    const router = useRouter()
    const { mutateUser } = useUser()

    const handleClick = async function(event) {
        event.preventDefault()
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

            /*
            may seem redundant to directly push login to router here but 
            cant rely on redirect effect of useUser hook to redirect
            to login at this point because it would allow a render attempt
            of components that assume defined user with undefined user, causing
            runtime ref error (previously prevented by ancestor page component
            auth guard behavior that specifies redirect behavior in its useUser 
            call). note that login page is in fact auth/render guarded and so
            it checks for undefined user (by checking loadingUser).
            */
            router.push('/login')  
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
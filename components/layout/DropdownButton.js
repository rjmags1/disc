import { useRouter } from 'next/router'
import { useUser } from '../../lib/hooks'

function DropdownButton({ label, last, href, hamburgerItem=false }) {
    const router = useRouter()
    const { 
        loading: loadingUser, 
        mutateUser 
    } = useUser({ redirectTo: '/login' })

    const handleClick = async function(event) {
        event.preventDefault()
        if (loadingUser) return

        if (/logout/i.test(href)) {
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
        else if (href) router.push(href)
    }

    const baseStyles = "w-full hover:bg-violet-500 px-4 py-1"
    if (hamburgerItem) baseStyles += " sm:hidden"
    const styles = last ? baseStyles + " rounded-b-md" : baseStyles
    return (
        <div data-testid="dropdown-button-container"
            className={ styles } onClick={ handleClick }>
            <button className="w-full text-right">{ label }</button>
        </div>
    )
}

export default DropdownButton
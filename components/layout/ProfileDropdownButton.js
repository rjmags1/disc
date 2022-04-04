import { useRouter } from 'next/router'
import { useUser } from '../../lib/hooks'

function ProfileDropdownButton({ label, last, href }) {
    const router = useRouter()
    const { mutateUser } = useUser({ redirectTo: '/login' })

    const handleClick = function(event) {
        event.preventDefault()
        if (/logout/gi.test(href)) {
            mutateUser(async () => {
                await fetch("/api/logout", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" }
                })
            })
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
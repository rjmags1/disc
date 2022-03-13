import { useRouter } from 'next/router'

function ProfileDropdownButton({ label, last, href }) {
    // TODO: impl custom fxn for logout dropdown button
    const router = useRouter()
    const handleClick = function(e) {
        e.preventDefault()
        router.push(href)
    }

    const baseStyles = "p-1 hover:bg-violet-500"
    const styles = last ? baseStyles + " rounded-b-md" : baseStyles
    return (
        <div data-testid="profile-dropdown-button-container"
            className={ styles } onClick={ handleClick }>
            <button>{ label }</button>
        </div>
    )
}

export default ProfileDropdownButton
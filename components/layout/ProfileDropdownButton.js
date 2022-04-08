import { useRouter } from 'next/router'
import { useUser } from '../../lib/hooks'

function ProfileDropdownButton({ label, last, href }) {
    const router = useRouter()
    const { mutateUser } = useUser({ redirectTo: '/login' })

    const handleClick = async function(event) {
        event.preventDefault()
        if (/logout/gi.test(href)) {
            // destroy session cookie
            await fetch("/api/auth/logout", {
                method: "POST",
                headers: { "Content-Type": "application/json" }
            })
            // cast revalidation message on user data hook 
            mutateUser()

            /*
            cant utilize redirect effect of useUser hook to redirect
            to login at this point because we cant allow attempts to 
            render components on the current page who useUser and expect 
            parent page component to auth/render guard on user for them. 
            render guard --> if (loadingUser) return <Loading />.
            note that login page is in fact auth/render guarded.
            not forcing a login page render by pushing to router here could
            cause current page components, who were previously protected
            from runtime undefined user ReferenceError by a render guarding 
            parent page component, to throw runtime ReferenceError on 
            undefined user before the post-logout-click, revalidated user  
            useUser effect causes login page redirection.
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
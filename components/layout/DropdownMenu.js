import DropdownButton from './DropdownButton'

function DropdownMenu() {
    return (
        <ul data-testid="dropdown-container"
            className="fixed w-fit bg-purple text-white top-9 
                sm:top-12 rounded-b-md border-black right-0">
            <DropdownButton label="Home" href="/" hamburgerItem={ true }/>
            <DropdownButton label="Notifications" hamburgerItem={ true }/>
            <DropdownButton label="Account" href="/settings/account" />
            <DropdownButton label="Notification Settings" 
                href="/settings/notifications"/>
            <DropdownButton label="Log out" last={ true } 
                href="/logout"/>
        </ul>
    )
}

export default DropdownMenu
import SettingsMenuButton from './SettingsMenuButton'

function SettingsMenuPane() {
    return (
        <div data-testid="settings-menu-pane-container"
            className="hidden md:flex flex-col w-60 
                bg-light-gray h-full items-end p-6 fixed">
            <SettingsMenuButton label="Account" href="/settings/account"/>
            <SettingsMenuButton label="Notifications" 
                href="/settings/notifications"/>
        </div>
    )
}

export default SettingsMenuPane
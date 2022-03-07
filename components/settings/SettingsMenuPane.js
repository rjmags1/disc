import SettingsMenuButton from './SettingsMenuButton'

function SettingsMenuPane() {
    return (
        <div data-testid="settings-menu-pane-container"
            className="min-w-fit flex-auto p-4 bg-light-gray text-white
                h-full flex-col">
            <SettingsMenuButton label="Account" href="/settings/account"/>
            <SettingsMenuButton label="Notifications" href="/settings/notifications"/>
        </div>
    )
}

export default SettingsMenuPane
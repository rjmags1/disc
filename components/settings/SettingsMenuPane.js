import SettingsMenuButton from './SettingsMenuButton'

function SettingsMenuPane() {
    return (
        <div data-testid="settings-menu-pane-container"
            className="flex flex-col flex-auto w-48 max-w-s bg-light-gray h-full
                items-end p-6">
            <SettingsMenuButton label="Account" href="/settings/account"/>
            <SettingsMenuButton label="Notifications" href="/settings/notifications"/>
        </div>
    )
}

export default SettingsMenuPane
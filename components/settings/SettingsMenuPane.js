import SettingsMenuButton from './SettingsMenuButton'

function SettingsMenuPane() {
    return (
        <div data-testid="settings-menu-pane-container">
            <SettingsMenuButton label="Account" href="/settings/account"/>
            <SettingsMenuButton label="Notifications" href="settings/notifications"/>
        </div>
    )
}

export default SettingsMenuPane
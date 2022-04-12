import SettingsMenuPane from '../settings/SettingsMenuPane'

function SettingsLayout({ children }) {
    return (
        <div data-testid="settings-container"
            className="flex items-start h-full pb-10">
            <SettingsMenuPane />
            { children }
        </div>
    )
}

export default SettingsLayout
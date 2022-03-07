import SettingsMenuPane from '../settings/SettingsMenuPane'

function SettingsLayout({ children }) {
    return (
        <>
            <SettingsMenuPane />
            { children }
        </>
    )
}

export default SettingsLayout
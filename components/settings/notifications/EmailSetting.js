import SettingToggler from './SettingToggler'

function EmailSetting({ label, status, handleChange }) {
    return (
        <div data-testid="notifications-setting-container">
            <h4>{ label }</h4>
            <SettingToggler isOn={ status } handleClick={ handleChange } />
        </div>
    )
}

export default EmailSetting
import SettingToggler from './SettingToggler'

function EmailSetting({ label, status, dStatus, handleChange }) {
    return (
        <div data-testid="notifications-setting-container"
            className="flex justify-between items-center border border-white
                rounded bg-light-gray px-4 py-3 mb-4">
            <h4>{ label }. Currently <em><strong>{ status ? "enabled" : "disabled" }</strong></em>.</h4>
            <SettingToggler isOn={ dStatus } handleClick={ handleChange } />
        </div>
    )
}

export default EmailSetting
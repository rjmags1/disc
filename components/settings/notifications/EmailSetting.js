import SettingToggler from './SettingToggler'

function EmailSetting({ label, status, handleChange }) {
    return (
        <div data-testid="notifications-setting-container"
            className="flex justify-between items-center border border-white
                rounded bg-light-gray px-4 py-3 mb-4">
            <h4>{ label }</h4>
            <SettingToggler isOn={ status } handleClick={ handleChange } />
        </div>
    )
}

export default EmailSetting
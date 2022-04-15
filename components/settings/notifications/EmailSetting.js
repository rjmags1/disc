import SettingToggler from './SettingToggler'

function EmailSetting({ label, status, dStatus, handleChange }) {
    const statusString = status ? " enabled" : " disabled"
    const styledStatusString = <em><strong>{ statusString }</strong></em>
    
    return (
        <div data-testid="notifications-setting-container"
            className="flex flex-col md:flex-row justify-between items-center border 
                border-white rounded bg-light-gray px-4 py-3 mb-4">
            <h4>{ label }. Currently { styledStatusString }.</h4>
            <SettingToggler isOn={ dStatus } handleClick={ handleChange } />
        </div>
    )
}

export default EmailSetting
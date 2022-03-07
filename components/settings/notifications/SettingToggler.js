function SettingToggler({ isOn, handleClick }) {
    return (
        <div data-testid="notifications-setting-toggler" >
            <button type="button" onClick={ handleClick }>
                { isOn ? "ON" : "OFF" }
            </button>
        </div>
    )
}

export default SettingToggler
function SettingToggler({ isOn, handleClick }) {
    const baseStyle = `
        border border-white rounded px-4 py-0.5
        min-w-max w-24 hover:cursor-pointer `

    return (
        <div data-testid="notifications-setting-toggler"
            className="mr-1">
            <button type="button" onClick={ handleClick }
                className={ baseStyle + (isOn ? 
                    "bg-red-600 hover:bg-red-800" :
                    "bg-green-600 hover:bg-green-800") } >
                { isOn ? "Disable" : "Enable" }
            </button>
        </div>
    )
}

export default SettingToggler
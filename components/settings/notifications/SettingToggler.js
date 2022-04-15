function SettingToggler({ isOn, handleClick }) {
    const baseStyle = `
        border border-white rounded w-full py-1 my-2 mt-4
        md:px-4 md:py-0.5
        md:min-w-max md:w-24 hover:cursor-pointer md:ml-8 `

    return (
        <div data-testid="notifications-setting-toggler"
            className="mx-2 w-full md:w-fit">
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
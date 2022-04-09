function Datalist({ handleChange, label, optionValues }) {
    const options = optionValues.map((val, i) => 
        <option value={ val } key={ `${val}-${i}` }>{ val }</option>
    )

    return (
        <div data-testid="datalist-container-test" className="py-2">
            <label htmlFor="organization-input">{ label } </label>
            <input list="organizations-datalist" id="organization-input"
                name="organization-input" onChange={ handleChange } required
                className="w-full rounded-md h-10 text-black p-2 my-1"
                autoComplete="off"/>
            <datalist id="organizations-datalist" 
                data-testid="datalist-datalist-test">
                { options }
            </datalist>
        </div>
    )
}

export default Datalist
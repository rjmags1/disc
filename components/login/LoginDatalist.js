function Datalist({ handleChange, info, optionValues }) {
    const { containerTestId, inputId,
            label, datalistId, datalistTestId } = info

    const options = optionValues.map((val, i) => 
        <option value={ val } key={ `${val}-${i}` }>{ val }</option>
    )
    return (
        <div data-testid={ containerTestId } className="py-2">
            <label htmlFor={ inputId }>{ label } </label>
            <input list={ datalistId } id={ inputId }
                name={ inputId } onChange={ handleChange } required
                className="w-full rounded-md h-10 text-black p-2 my-1" autoComplete="off"/>
            <datalist id={ datalistId } 
                data-testid={ datalistTestId }>
                { options }
            </datalist>
        </div>
    )
}

export default Datalist
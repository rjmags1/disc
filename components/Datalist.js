function Datalist({ handleChange, info }) {
    const { optionValues, containerTestId, inputId,
            labelTestId, label, datalistId, datalistTestId } = info
    const options = optionValues.map((val, i) => 
        <option value={ val } key={ `${val}-${i}` }>{ val }</option>
    )
    
    return (
        <div data-testid={ containerTestId }>
            <label htmlFor={ inputId } data-testid={ labelTestId }>
                { label } 
            </label>
            <input list={ datalistId } id={ inputId }
                name={ inputId } onChange={ handleChange } />
            <datalist id={ datalistId } 
                data-testid={ datalistTestId }>
                { options }
            </datalist>
        </div>
    )
}

export default Datalist
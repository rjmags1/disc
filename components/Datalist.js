function Datalist({ handleChange, info }) {
    const options = info.optionValues.map(val => 
        <option value={ val } key={ val }>{ val }</option>
    )
    
    return (
        <div data-testid={ info.containerTestId }>
            <label htmlFor={ info.inputId } data-testid={ info.labelTestId }>
                { info.label } 
            </label>
            <input list={ info.datalistId } id={ info.inputId }
                name={ info.inputId } onChange={ handleChange } />
            <datalist id={ info.datalistId } 
                data-testid={ info.datalistTestId }>
                { options }
            </datalist>
        </div>
    )
}

export default Datalist
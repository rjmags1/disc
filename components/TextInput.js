function TextInput({ handleChange, info }) {
    const { label, inputId, containerTestId } = info

    return (
        <div data-testid={ containerTestId }>
            <label htmlFor={ inputId }>{ label }</label>
            <input type="text" id={ inputId } onChange={ handleChange }
                name={ label } required/>
        </div>
    )
}

export default TextInput
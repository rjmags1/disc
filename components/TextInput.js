function TextInput({ handleChange, info }) {
    const { label, placeholderText, inputId, required,
            labelTestId, containerTestId } = info

    return (
        <div data-testid={ containerTestId }>
            <label htmlFor={ inputId } data-testid={ labelTestId }>
                { label }
            </label>
            <input type="text" id={ inputId } onChange={ handleChange }
                name={ label } placeholder={ placeholderText } required={ required }/>
        </div>
    )
}

export default TextInput
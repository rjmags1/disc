function LoginTextInput({ handleChange, info, blur }) {
    const { label, inputId, containerTestId } = info

    return (
        <div data-testid={ containerTestId } className="py-2">
            <label htmlFor={ inputId }>{ label } </label>
            <input type={ blur ? "password" : "text" } id={ inputId } 
                onChange={ handleChange } name={ label } required 
                className="w-full rounded-md h-10 text-black p-2 my-1"/>
        </div>
    )
}

export default LoginTextInput
import ButtonLoading from "../lib/ButtonLoading"

function NormalLoginButton({ handleClick, processingNormal, processing }) {
    const normalStyles = `w-full bg-purple rounded-md h-12 mt-7 
        hover:bg-violet-600 hover:cursor-pointer`
    const processingStyles = `w-full bg-purple rounded-md h-12 mt-7 
        hover:cursor-not-allowed`

    return (
        <button type="button" onClick={ handleClick } 
            id="full-login-submit-button"  disabled={ processing ? true : "" }
            className={ `${ processing ? processingStyles : normalStyles}` }>
            { processingNormal ? 
            <span className='flex justify-center items-center'>
                Processing...<ButtonLoading />
            </span>  
            : 
            "Login" }
        </button>
    )
}

export default NormalLoginButton
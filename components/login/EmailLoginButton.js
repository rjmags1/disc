import ButtonLoading from "../lib/ButtonLoading";

function EmailLoginButton({ handleClick, processing, processingEmail }) {
    const normalStyles = `mt-7 p-3 bg-slate-600 rounded-md 
        hover:bg-gray-700 h-12 w-full`
    const processingStyles = `mt-7 p-3 bg-slate-600 rounded-md 
        hover:cursor-not-allowed h-12 w-full`

    return (
        <button type="button" id="email-login-submit-button"
            className={ `${ processing ? processingStyles : normalStyles }` }
            onClick={ handleClick } disabled={ processing ? true : "" }>
            { processingEmail ? 
            <span className='flex justify-center items-center'>
                Processing...<ButtonLoading />
            </span>  
            : 
            "Email Me Login Link" }
        </button>
    )
}

export default EmailLoginButton
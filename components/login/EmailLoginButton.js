import ButtonLoading from "../lib/ButtonLoading";

function EmailButtonLoading({ handleClick, processing }) {
    return (
        <button type="button" className="mt-7 p-3 bg-slate-600 
            rounded-md hover:bg-gray-700 h-12 w-full" 
            id="email-login-submit-button" onClick={ handleClick }>
            { processing ? 
            <span className='flex justify-center items-center'>
                Processing...<ButtonLoading />
            </span>  
            : 
            "Email Me Login Link" }
        </button>
    )
}

export default EmailButtonLoading
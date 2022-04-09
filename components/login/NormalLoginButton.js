import ButtonLoading from "../lib/ButtonLoading"

function NormalLoginButton({ handleClick, processing }) {
    return (
        <button type="button" onClick={ handleClick }
            id="full-login-submit-button"
            className="w-full bg-purple rounded-md h-12 mt-7 
            hover:bg-violet-600 hover:cursor-pointer" >
            { processing ? 
            <span className='flex justify-center items-center'>
                Processing...<ButtonLoading />
            </span>  
            : 
            "Login" }
        </button>
    )
}

export default NormalLoginButton
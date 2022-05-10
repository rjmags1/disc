import Image from "next/image"

function PostAttributesDropdownButton({ show, handleClick }) {
    const buttonStyles = `${ show ? "rotate-180" : "" } 
        mr-2 opacity-40 hover:cursor-pointer flex-none w-[15px]`
    return (
        <button className={ buttonStyles } onClick={ handleClick }
            data-testid="attributes-dropdown-button">
            <Image src="/sort-down.png" width="15" height="15" 
                data-testid="toggler"/>
        </button>
    )
}

export default PostAttributesDropdownButton
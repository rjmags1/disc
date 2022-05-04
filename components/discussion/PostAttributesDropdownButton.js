import Image from "next/image"

function PostAttributesDropdownButton({ show, handleClick }) {
    const buttonStyles = `${ show ? "rotate-180" : "" } 
        mr-2 opacity-40 hover:cursor-pointer`
    return (
        <div className={ buttonStyles } onClick={ handleClick }>
            <Image src="/sort-down.png" width="15" height="15" 
                data-testid="toggler"/>
        </div>
    )
}

export default PostAttributesDropdownButton
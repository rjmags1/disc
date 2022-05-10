function PostAttribute({ attribute, selected, changeAttribute }) {

    return (
        <li className="hover:bg-zinc-500 hover:cursor-pointer font-thin
            flex justify-between px-2" data-testid="post-attribute-container"
            onClick={ () => changeAttribute(attribute) } >
            { selected && 
            <span className="pl-1" data-testid="attribute-selected">✓</span> }
            <p className="text-right w-full pr-1" data-testid="post-attribute">
                { attribute }
            </p>
        </li>
    )
}

export default PostAttribute
function ReplyButton({ parentId, ancestorId, setClicked }) {
    return (
        <button className="px-1 hover:opacity-60" 
            onClick={ () => setClicked(true) }>
            REPLY
        </button> 
    )
}

export default ReplyButton
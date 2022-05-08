function Comments({ numComments }) {
    return (
        <label className="max-w-[40px] h-[20px] flex items-center 
            justify-center opacity-50 ml-2" data-testid="comments-icon">
            <span className="text-xs mr-1 truncate">{ numComments }</span>
            <img src="/comment.png" width="12" className="mt-1" />
        </label>
    )
}

export default Comments
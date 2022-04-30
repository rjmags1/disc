function Comments({ numComments }) {
    return (
        <div className="w-[20px] h-[20px] flex items-center 
            justify-center opacity-50 mr-2">
            <span className="text-xs mr-1">{ numComments }</span>
            <img src="/comment.png" width="12" className="mt-0.5" />
        </div>
    )
}

export default Comments
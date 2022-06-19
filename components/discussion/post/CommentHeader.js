function CommentHeader({ headerProps }) {
    const { 
        info, deleted, commentResolving, commentIsAnswer, endorsed
    } = headerProps

    return (
        <div className="flex flex-col justify-start items-center" >
            <img width="40" className="rounded-full" data-testid="comment-prof-pic" 
                    src={ info.anonymous || deleted ? 
                    "/profile-button-img.png" : info.avatarUrl }/>
            <div className='flex-col items-center justify-center my-2'>
                { (commentResolving || commentIsAnswer) && 
                    <img className="ml-[1px]" width="19" src="/checkmark.png" 
                        data-testid="comment-check-icon" /> }
                { endorsed &&
                <>
                    {(commentResolving || commentIsAnswer) && <div className='h-[0.5rem]'/> }
                    <span className="h-[20px] w-[21px]" >
                        <img src="/endorsed.png" width="20" 
                            data-testid="comment-endorsed-icon" />
                    </span>
                </>
                }
            </div>
        </div>
    )
}

export default CommentHeader
function CommentHeader({ headerProps }) {
    const { 
        info, userDeleted, commentResolving, commentIsAnswer, endorsed
    } = headerProps

    return (
        <div className="flex flex-col justify-start items-center" >
            <img width="40" className="rounded-full" src={ 
                    info.anonymous || userDeleted ? 
                    "/profile-button-img.png" : info.avatarUrl }/>
            <div className='flex-col items-center justify-center my-2'>
                { (commentResolving || commentIsAnswer) && 
                    <img className="ml-[1px]" width="19" src="/checkmark.png" /> }
                { endorsed &&
                <>
                    {(commentResolving || commentIsAnswer) && <div className='h-[0.5rem]'/> }
                    <span className="h-[20px] w-[21px]" >
                        <img src="/endorsed.png" width="20"/>
                    </span>
                </>
                }
            </div>
        </div>
    )
}

export default CommentHeader
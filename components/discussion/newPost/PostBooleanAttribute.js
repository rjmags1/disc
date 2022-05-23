function PostBooleanAttribute({ label, stateSetter }) {
    return (
        <label className='flex font-thin text-md h-fit items-center mx-1'>
            <input type="checkbox" className='accent-[#9400FF] mr-1 h-fit'
                onChange={ stateSetter }/>
            <span className='no-wrap'>{ label }</span>
        </label>
    )
}

export default PostBooleanAttribute
function PostInfoTextSearchFilter({ setFilterText }) {

    const handleChange = (event) => {
        setFilterText(event.target.value)
    }
    return (
        <input className="p-1 mx-2 px-2 w-full rounded bg-zinc-700
            focus:outline-none font-sans font-thin"
            placeholder="Search" onChange={ handleChange } />
    )
}

export default PostInfoTextSearchFilter
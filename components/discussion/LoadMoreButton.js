function LoadMoreButton({ handleClick }) {
    return (
        <div className="w-full h-[60px] flex items-center justify-center">
            <button onClick={ handleClick } className="text-white 
                font-mono bg-purple w-4/5 p-2 rounded hover:bg-light-gray" >
                Load More Posts
            </button>
        </div>
    )
}

export default LoadMoreButton
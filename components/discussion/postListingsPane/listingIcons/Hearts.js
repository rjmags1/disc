function Hearts({ numHearts }) {
    return (
        <label className="opacity-50 flex items-center 
            justify-center h-[20px] max-w-[40px]" data-testid="likes-icon">
            <span className="text-xs mr-1 truncate">{ numHearts }</span>
            <img src="/heart.png" width="12" className="mt-[2px]"/>
        </label>
    )
}

export default Hearts
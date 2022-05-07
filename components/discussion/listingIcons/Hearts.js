function Hearts({ numHearts }) {
    return (
        <div className="mr-2 opacity-50 flex items-center 
            justify-center h-[20px] w-[20px]" data-testid="likes-icon">
            <span className="text-xs mr-0.5">{ numHearts }</span>
            <img src="/heart.png" width="12" className="mt-[2px]"/>
        </div>
    )
}

export default Hearts
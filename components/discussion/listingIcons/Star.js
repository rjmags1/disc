function Star() {
    return (
        <label className="w-[20px] h-[20px] flex items-center 
            justify-center mr-2" data-testid="star-icon">
            <img src="/star.png" width="15" className="mb-0.5"/>
        </label>
    )
}

export default Star
function Checkmark() {
    return (
        <label className="w-[20px] h-[20px] flex items-center 
            justify-center mr-2" data-testid="green-checkmark-icon">
            <img src="/checkmark.png" width="15" className=""/>
        </label>
    )
}

export default Checkmark
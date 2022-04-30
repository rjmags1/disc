function QuestionMark() {
    return (
        <div className="border border-white rounded-full w-[20px] h-[20px] 
            flex items-center justify-center mr-2">
            <img src="/question-mark.png" width="16" 
                style={ { padding: "2px", marginLeft: "1px" } }/>
        </div>
    )
}

export default QuestionMark
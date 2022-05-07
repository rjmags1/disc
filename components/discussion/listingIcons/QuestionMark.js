function QuestionMark() {
    return (
        <div className="border border-white rounded-full w-fit h-[18px] 
            flex items-center justify-start mr-2" data-testid="question-icon">
            <img src="/question-mark.png" width="15" 
                className="p-[2px]"/>
        </div>
    )
}

export default QuestionMark
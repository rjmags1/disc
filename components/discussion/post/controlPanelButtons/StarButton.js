import { useState } from 'react'

function StarButton({ starred }) {
    const [status, setStatus] = useState(starred)

    return (
        <div data-testid="starred-button-container" className="h-[40px] w-[30%]">
            <button className="flex items-center justify-center w-full 
                h-full rounded bg-yellow-500 hover:bg-yellow-600 
                hover:cursor-pointer">
                <span>{ status ? "Unstar" : "Star" }</span>
            </button>
        </div>
    )
}

export default StarButton
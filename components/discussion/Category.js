import DeselectCategoryButton from './DeselectCategoryButton'
import { useRef, useEffect, useState } from 'react'

function Category({ info, bulletColor }) {
    const [selected, setSelected] = useState(null)
    const bulletRef = useRef(null)
    const containerRef = useRef(null)

    useEffect(() => {
        if (!containerRef.current) return

        // perform post filtering

        containerRef.current.style.backgroundColor = selected ?
            "#27272A" : ""
    }, [selected, containerRef])

    useEffect(() => {
        if (!bulletRef.current) return

        bulletRef.current.style.backgroundColor = bulletColor
    }, [bulletRef])

    return (
        <div data-testid="category-header-container" ref={ containerRef }
            className="w-full py-1 font-mono text-sm flex items-center 
                hover:cursor-pointer px-4"
            onClick={ () => setSelected(!selected) }>
            <div data-testid="category-bullet" ref={ bulletRef }
                className="w-[6px] h-[6px] ml-1 mr-2 shrink-0" />
            <h4 className="shrink-1 grow whitespace-nowrap 
                    overflow-hidden mr-2 text-ellipsis select-none">
                { info.category }
            </h4>
            { selected && <DeselectCategoryButton /> }
        </div>
    )
}

export default Category
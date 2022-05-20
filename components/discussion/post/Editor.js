import Quill from "quill"
import { useRef, useEffect, useState } from 'react'

let quill

function Editor({ hideEditor, handleSubmit }) {
    const [tick, setTick] = useState(0)
    const [anonymous, setAnonymous] = useState(false)
    const editorRef = useRef(null)
    useEffect(() => {
        if (!editorRef.current || tick > 0) return
        quill = new Quill(editorRef.current, {
            theme: 'snow'
        })
        setTick(prev => prev + 1)
        
    }, [editorRef.current])

    useEffect(() => {
        if (!editorRef.current) return

        const svgs = document.getElementsByTagName("svg")
        for (let i = 0; i < svgs.length; i++) {
            setStrokeWhiteOnSVG(svgs[i])
        }
    }, [tick])

    const removeToolbarAndEditor = () => {
        removeToolbar(editorRef.current)
        hideEditor()
    }

    const handleSubmitClick = async () => {
        const submitted = await handleSubmit({ 
            editContent: quill.getContents(),
            displayContent: editorRef.current.firstElementChild.innerHTML,
            anonymous
        })
        if (submitted) removeToolbarAndEditor()
    }

    return (
        <>
            <div id="quill-editor-container" ref={ editorRef } 
                className="text-white rounded-b-[10px]" />
            <div className="flex mb-2">
                <button className="mt-2 bg-purple py-0.5 px-2 rounded border
                    border-white hover:bg-violet-800" onClick={ handleSubmitClick }>
                    Submit
                </button>
                <button className="mx-2 mt-2 py-0.5 opacity-60 underline 
                    hover:opacity-30 font-thin text-sm" 
                    onClick={ () => setAnonymous(prev => !prev) }>
                    { anonymous ? "Unmark anonymous" : "Mark anonymous" }
                </button>
                <button className="mt-2 py-0.5 opacity-60 underline 
                    hover:opacity-30 font-thin text-sm" 
                    onClick={ removeToolbarAndEditor }>
                    Cancel
                </button>
            </div>
        </>
        
    )
}

const setStrokeWhiteOnSVG = (elem) => {
    if (!elem.children.length) return

    const children = elem.children
    for (let i = 0; i < children.length; i++) {
        const child = children[i]
        child.style.stroke = "white"
        setStrokeWhiteOnSVG(child)
    }
}

const removeToolbar = (editorElem) => {
    if (!editorElem) return
    editorElem.previousElementSibling.remove()
}

export default Editor
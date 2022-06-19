import Quill from "quill"
import { sanitize } from 'dompurify'
import { useRef, useEffect, useState } from 'react'


function Editor(props) {
    const { 
        hideEditor, handleSubmit, editContent, isPost, editingPost, editingComment 
    } = props
    const [tick, setTick] = useState(0) // used to trigger rerender
    const [anonymous, setAnonymous] = useState(
        false) // if true a new comment or post will be submitted anonymously. 
               // always false for edited comments or posts

    const editorRef = useRef(null)
    const quillObjectRef = useRef(null)


    useEffect(() => { // init quill once its container is rendered
        if (!editorRef.current || tick > 0) return

        // use quill constructor to initialize and insert a quill 
        // editor into its container, editorRef
        const newQuill = new Quill(
            editorRef.current, { theme: 'snow' })
        
        // put the comment or post to be edited in the editor if appropriate
        if (!!editContent && (editingComment || editingPost)) {
            newQuill.setContents(editContent)
        }

        quillObjectRef.current = newQuill
        setTick(prev => prev + 1)
        
    }, [editorRef.current])

    useEffect(() => { // once quill is init style the toolbar icons
        if (!editorRef.current) return

        const svgs = document.getElementsByTagName("svg")
        for (let i = 0; i < svgs.length; i++) {
            setStrokeWhiteOnSVG(svgs[i])
        }
    }, [tick])

    const removeToolbarAndEditor = () => {
        // remove the editor toolbar, which should always be handled
        // from within this component. if passed a custom method for
        // removing the actual editor, call it, otherwise rely on
        // this components parents to remove the editor instance
        // with its own conditional rendering mechanism
        removeToolbar(editorRef.current)
        if (!!hideEditor) hideEditor()
    }

    const handleSubmitClick = async () => {
        // sanitize the generated html from user interactions with the quill
        // editor, then use the passed handleSubmit method to pass the 
        // editor contents to the backend. Only remove the editor and toolbar
        // if the backend update was successful

        const sanitizedUserHtmlFromQuill = sanitize(
            editorRef.current.firstElementChild.innerHTML)
        const submitted = await handleSubmit({ 
            editContent: quillObjectRef.current.getContents(),
            displayContent: sanitizedUserHtmlFromQuill,
            anonymous
        })
        if (submitted) removeToolbarAndEditor()
    }

    return (
        <>
            <div id="quill-editor-container" ref={ editorRef } 
                className="text-white rounded-b-[10px]" 
                style={ isPost ? { fontSize: '1rem', fontWeight: 200 } : {} } />
            <div className="flex mb-2 items-center mt-3 gap-3">
                <button className="h-full bg-purple rounded border py-0.5 px-2
                    border-white hover:bg-violet-800" onClick={ handleSubmitClick }
                    style={ isPost ? 
                        { paddingLeft: '2rem', paddingRight: '2rem' } : {} }
                    data-testid="editor-submit-button">
                    { isPost && !editingPost ? "Post" : "Submit" }
                </button>
                { !isPost && 
                <button className="h-full opacity-60 underline 
                    hover:opacity-30 font-thin text-sm" 
                    onClick={ () => setAnonymous(prev => !prev) }>
                    { anonymous ? "Unmark anonymous" : "Mark anonymous" }
                </button> }
                { (!isPost || editingPost) && 
                <button className="h-full opacity-60 underline 
                    hover:opacity-30 font-thin text-sm" 
                    onClick={ removeToolbarAndEditor }>
                    Cancel
                </button> }
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
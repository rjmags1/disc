import useState from 'react'

import FailedUploadMessage from './FailedUploadMessage'

function NewAvatarButton({ handleNewSrc }) {
    //const [showFailedUploadMessage, setShowFailedUploadMessage] = useState(false)

    const sendToServer = async function(event) {
        //if (!event.target.files || !event.target.files[0]) return;

        //const fileList = event.target.files
        //const numFiles = fileList.length
        //const body = new FormData()
        //body.append("file", fileList[numFiles - 1])
        //const response = await fetch("api/file/prof-pic", {
        //    method: "POST",
        //    body
        //})
        //if (response.status === 201) {
        //    setShowFailedUploadMessage(false)
        //    handleNewSrc(response.body)
        //}
        //else setShowFailedUploadMessage(true)
    }

    return (
        <div data-testid="new-avatar-btn-container" >
            <input type="file" accept="image/*" 
                onChange={ sendToServer } data-testid="new-avatar-input"/>
        </div>
    )
}

export default NewAvatarButton
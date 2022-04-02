import { useState } from 'react'

import ImageFailedUploadMessage from './ImageFailedUploadMessage'

function NewAvatarButton({ handleNewSrc }) {
    const [failedUploadMessage, setfailedUploadMessage] = useState(false)

    const sendToServer = async function(event) {
        //if (!event.target.files || !event.target.files[0]) return;

        // /api/account/updatePerson call
    }

    return (
        <div data-testid="new-avatar-btn-container"
            className="mt-2" >
            <label className="text-xs bg-purple border border-white 
                p-1 rounded hover:bg-black hover:cursor-pointer">
                <input type="file" accept="image/*" 
                    onChange={ sendToServer } data-testid="new-avatar-input"
                    className="hidden"/>
                New Avatar
            </label>
            { failedUploadMessage && <ImageFailedUploadMessage /> }
        </div>
    )
}

export default NewAvatarButton
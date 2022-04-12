function ImageFailedUploadMessage() {
    const uploadFailedMsg = `
        Your image failed to upload. Please check your network
        connection and image file type and try again.`

    return (
        <div data-testid="failed-upload-message-container">
            { uploadFailedMsg }
        </div>
    )
}

export default ImageFailedUploadMessage
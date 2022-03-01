function NotificationsButton() {
    return (
        <div data-testid="notifications-button-container"
            className="p-1 sm:p-3">
            <input type="image" src="/notifications-bell.png"
                width="30" height="30"/>
        </div>
    )
}

export default NotificationsButton
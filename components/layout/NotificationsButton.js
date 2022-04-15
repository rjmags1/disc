function NotificationsButton() {
    return (
        <div data-testid="notifications-button-container"
            className="hidden sm:block p-3 mt-1">
            <input type="image" src="/notifications-bell.png"
                width="30" height="30"/>
        </div>
    )
}

export default NotificationsButton
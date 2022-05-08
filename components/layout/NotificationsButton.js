function NotificationsButton() {
    return (
        <button data-testid="notifications-button-container"
            className="hidden sm:block p-3">
            <img src="/notifications-bell.png" width="32" height="32"/>
        </button>
    )
}

export default NotificationsButton
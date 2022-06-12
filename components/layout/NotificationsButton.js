import { useState, useEffect } from 'react'
import { useNotifications } from '../../lib/hooks'
import ButtonLoading from '../lib/ButtonLoading'
import Notification from './Notification'
import OutsideClickHandler from 'react-outside-click-handler'

function NotificationsButton() {
    const [showNotifs, setShowNotifs] = useState(false)
    const [afterTime, setAfterTime] = useState(0)
    const [intervalId, setIntervalId] = useState(null)
    const [notifications, setNotifications] = useState([])
    const {
        notifications: loadedNotifs, loading: loadingNotifs
    } = useNotifications(afterTime)

    useEffect(() => {
        const iid = setInterval(
            () => setAfterTime(Date.now()), 3 * 60 * 1000)

        setIntervalId(iid)
        return () => { clearInterval(intervalId) }
    }, [])

    useEffect(() => {
        if (loadedNotifs.length === 0 || loadingNotifs) return

        setNotifications([...loadedNotifs, ...notifications])
    }, [loadedNotifs])

    return (
        <OutsideClickHandler onOutsideClick={ () => setShowNotifs(false) }>
            <button data-testid="notifications-button-container"
                className="hidden sm:block p-3 relative" 
                onClick={ () => setShowNotifs(prev => !prev)}>
                <img src="/notifications-bell.png" width="32" height="32"/>
                {showNotifs &&
                <ul className='bg-purple z-10 absolute w-[75vw] md:w-[50vw] 
                    lg:w-[25vw] -right-[40px] mt-[8px] flex items-center border-b
                    justify-center flex-col rounded-b border-x border-white shadow-xl'
                    data-testid="notifications-list">
                    { loadingNotifs ? 
                    <ButtonLoading /> : 
                    notifications.map((notifInfo, i) => 
                    <Notification info={ notifInfo } key={ i } 
                        last={ i === notifications.length - 1 }/>)}
                </ul>}
            </button>
        </OutsideClickHandler>
    )
}

export default NotificationsButton
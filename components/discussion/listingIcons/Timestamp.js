import { toTimestampString } from "../../../lib/time"

function Timestamp({ createdAt }) {
    return (
        <div className="mx-2 italic truncate pr-0.5">
            { toTimestampString(createdAt) }
        </div>
    )
}

export default Timestamp
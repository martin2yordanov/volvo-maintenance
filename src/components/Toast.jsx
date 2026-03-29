export default function Toast({ msg, on }) {
  return (
    <div className={`toast${on ? ' on' : ''}`}>
      {msg}
    </div>
  )
}

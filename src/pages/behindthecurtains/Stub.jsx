/**
 * BEHIND THE CURTAINS — stub page
 *
 * A placeholder that documents intent. Each stub lists what will live here
 * when built. This way the hub feels complete from day one — every room
 * has a sign on the door, even if the room is empty.
 */

export default function BehindTheCurtainsStub({ eyebrow, title, lede, plan }) {
  return (
    <div className="btc-stub">
      <div className="btc-stub__eyebrow">{eyebrow}</div>
      <h1 className="btc-stub__title">{title}</h1>
      <p className="btc-stub__lede">{lede}</p>

      <div className="btc-stub__plan">
        <div className="btc-stub__plan-head">Intended to hold</div>
        <ul className="btc-stub__plan-list">
          {plan.map((p, i) => (
            <li key={i} className="btc-stub__plan-item">{p}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

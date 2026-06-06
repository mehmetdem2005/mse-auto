export default function Login() {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <form action="/api/login" method="post" style={{ width: 320 }}>
        <div className="brand" style={{ fontSize: 18 }}>SHORTS·<b style={{ color: "var(--accent)" }}>PILOT</b></div>
        <div className="tag" style={{ margin: "4px 0 18px" }}>CONTROL PANEL — sign in</div>
        <input name="password" type="password" placeholder="Password" autoFocus />
        <button className="btn primary" style={{ marginTop: 12, width: "100%" }} type="submit">Enter</button>
      </form>
    </div>
  );
}

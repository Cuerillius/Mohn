import { useNav } from "../context/NavContext";

const PROFILES = [
  { initials: "JD", name: "Jamie" },
  { initials: "AK", name: "Alex" },
  { initials: "MR", name: "Morgan" },
  { initials: "+", name: "Add profile" },
];

export default function ProfilePage() {
  const { navigate } = useNav();
  return (
    <div className="profile-page">
      <h1 className="profile-heading">Who's watching?</h1>
      <p className="profile-sub"></p>
      <div className="profile-grid">
        {PROFILES.map((p) => (
          <div
            key={p.name}
            className="profile-card"
            onClick={() => navigate("home")}
          >
            <div className="profile-avatar">{p.initials}</div>
            <div className="profile-card-name">{p.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { useNavigate } from "react-router-dom";
import Avatar from "../components/AvatarMarble";

const PROFILES = [
  { initials: "JD", name: "Jamie" },
  { initials: "AK", name: "Alex" },
  { initials: "MR", name: "Morgan" },
  { initials: "+", name: "Add profile" },
];

export default function ProfilePage() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-20 px-8">
      <h1 className="text-[22px] font-normal text-white mb-2 tracking-[0.01em]">
        Who's watching?
      </h1>
      <p className="text-[13px] text-[#555] mb-12"></p>
      <div className="flex gap-5 flex-wrap justify-center mb-12">
        {PROFILES.map((p) => (
          <div
            key={p.name}
            className="group flex flex-col items-center gap-3 cursor-pointer transition-opacity duration-150 hover:opacity-75"
            onClick={() => navigate("/")}
          >
            <Avatar size={80} name={p.name} initials={p.initials} rounded />
            <div className="text-xs text-[#aaa] font-normal">{p.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

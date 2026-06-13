import { useNavigate } from "react-router-dom";

import { Profile, useProfile } from "../context/ProfileContext";
import { apiGet } from "../services/api";
import { Skeleton } from "../components/ui/skeleton";
import Avatar from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function ProfileSwitchPage() {
  const navigate = useNavigate();
  const { setProfile } = useProfile();

  const {
    data: profiles,
    isPending,
    error,
  } = useQuery({
    queryKey: ["profiles"],
    queryFn: () => apiGet<Profile[]>("/api/profiles"),
  });

  if (error) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-sm text-red-400">
          {error?.message || "Could not load profiles"}
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-12 px-4 py-16">
      <Button
        size="icon-lg"
        variant="ghost"
        onClick={() => navigate("/settings")}
        className="absolute top-8 right-8 rounded-full"
      >
        <Settings />
      </Button>
      <h1 className="text-3xl font-semibold tracking-tight text-white">
        Who's watching?
      </h1>

      <div className="flex flex-wrap items-start justify-center gap-6">
        {isPending
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-3">
                <Skeleton className="size-28 rounded-2xl" />
                <div className="h-4 w-20"></div>
              </div>
            ))
          : profiles.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setProfile(p);
                  navigate("/");
                }}
                className="group flex flex-col items-center gap-3 outline-none"
              >
                <Avatar
                  name={p.name}
                  className="flex size-28 items-center justify-center rounded-2xl text-3xl transition-all duration-150 ring-2 ring-transparent group-hover:ring-white"
                />
                <span className="text-sm font-medium text-white/60 transition-colors group-hover:text-white">
                  {p.name}
                </span>
              </button>
            ))}
      </div>
    </div>
  );
}

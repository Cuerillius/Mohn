import { useEffect, useRef } from "react";
import { apiPatch } from "../services/api";

export function useProgressSync(
  mediaId: string,
  mediaType: string,
  profileId: string | undefined,
  timePos: number,
  duration: number,
) {
  const lastSavedRef = useRef(0);

  // Keep latest values accessible in unmount cleanup without re-registering the effect
  const timePosRef = useRef(timePos);
  timePosRef.current = timePos;
  const durationRef = useRef(duration);
  durationRef.current = duration;
  const mediaIdRef = useRef(mediaId);
  mediaIdRef.current = mediaId;
  const mediaTypeRef = useRef(mediaType);
  mediaTypeRef.current = mediaType;
  const profileIdRef = useRef(profileId);
  profileIdRef.current = profileId;

  // Save on unmount
  useEffect(() => {
    return () => {
      save(timePosRef.current, durationRef.current, profileIdRef.current, mediaIdRef.current, mediaTypeRef.current);
    };
  }, []);

  // Auto-save every 10 seconds of playback
  useEffect(() => {
    if (!profileId || timePos < 30) return;
    if (timePos - lastSavedRef.current < 10) return;
    lastSavedRef.current = timePos;
    save(timePos, duration, profileId, mediaId, mediaType);
  }, [timePos, duration, profileId, mediaId, mediaType]);
}

function save(
  pos: number,
  dur: number,
  profileId: string | undefined,
  mediaId: string,
  mediaType: string,
) {
  if (!profileId || pos < 30) return;
  const savedPos = dur > 0 && pos / dur >= 0.9 ? 0 : Math.floor(pos);
  apiPatch(`/api/profiles/${profileId}/history/progress`, {
    mediaId,
    mediaType,
    position: savedPos,
    duration: Math.floor(dur),
  }).catch(() => {});
}

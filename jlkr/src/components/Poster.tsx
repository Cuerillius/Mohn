import { useNavigate } from "react-router-dom";
import { imgUrl, itemTitle } from "../services/tmdb";
import type { TMDBItem } from "../types/tmdb";
import { GalleryHorizontalEnd } from "lucide-react";

interface Props {
  item: TMDBItem;
  width?: number;
  height?: number;
}

export default function Poster({ item, width, height }: Props) {
  const navigate = useNavigate();
  const poster = imgUrl(item.poster_path, "w342");
  const title = itemTitle(item);
  const path = `/${item.media_type}/${item.id}`;
  return (
    <div
      className="poster group shrink-0 rounded-lg relative border-2 border-transparent hover:border-white/80"
      style={width ? { width, height } : undefined}
      onClick={() => navigate(path)}
    >
      <div className="absolute bottom-2 right-2 ">
        {item.media_type === "tv" && (
          <GalleryHorizontalEnd
            fill="currentColor"
            className="w-4 h-4 text-white/60"
          />
        )}
      </div>
      {poster ? (
        <img
          src={poster}
          alt={title}
          loading="lazy"
          className="w-full h-full object-cover block rounded-lg"
        />
      ) : (
        <div className="w-full h-full flex items-end p-2 rounded-lg bg-accent">
          <span className="text-xs text-white/35">{title}</span>
        </div>
      )}
    </div>
  );
}

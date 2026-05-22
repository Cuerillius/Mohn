import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ContentRow from '../components/ContentRow';
import EpisodeRow from '../components/EpisodeRow';
import { getTV, getTVSeason, getTVRecs, imgUrl, itemYear } from '../services/tmdb';
import type { TMDBTVDetail, TMDBSeason, TMDBItem } from '../types/tmdb';
import { useWatchlist } from '../hooks/useWatchlist';

type Tab = 'details' | `season-${number}` | 'similar';

const DETAIL_HERO_GRADIENT = 'linear-gradient(to top, rgba(31,31,31,1) 0%, rgba(31,31,31,0.2) 50%, transparent 100%), linear-gradient(to right, rgba(31,31,31,0.5) 0%, transparent 55%)';

const backBtnCls = 'absolute top-5 left-12 z-10 w-9 h-9 rounded-full bg-[rgba(42,42,42,0.7)] border-[0.5px] border-[#3a3a3a] text-[#aaa] cursor-pointer flex items-center justify-center transition-colors duration-150 shrink-0 hover:bg-[#2a2a2a]';

export default function SeriesDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [show, setShow] = useState<TMDBTVDetail | null>(null);
  const [seasons, setSeasons] = useState<TMDBSeason[]>([]);
  const [recs, setRecs] = useState<TMDBItem[]>([]);
  const [tab, setTab] = useState<Tab>('details');
  const { inList, toggle } = useWatchlist(id ?? '', 'tv');

  useEffect(() => {
    if (!id) return;
    setShow(null);
    setSeasons([]);
    setRecs([]);
    setTab('details');
    window.scrollTo(0, 0);

    Promise.all([getTV(Number(id)), getTVRecs(Number(id))])
      .then(([tv, tvRecs]) => {
        setShow(tv);
        setRecs(tvRecs);
        const seasonNums = (tv.seasons ?? [])
          .filter(s => s.season_number > 0)
          .map(s => s.season_number);
        const nums = seasonNums.length
          ? seasonNums
          : Array.from({ length: tv.number_of_seasons }, (_, i) => i + 1);
        Promise.all(nums.map(n => getTVSeason(Number(id), n)))
          .then(setSeasons)
          .catch(console.error);
      })
      .catch(console.error);
  }, [id]);

  if (!show) {
    return (
      <>
        <div className="relative w-full aspect-video max-h-[520px] overflow-hidden bg-[#1e2a3a]">
          <div className="absolute inset-0" style={{ background: DETAIL_HERO_GRADIENT }} />
          <button className={backBtnCls} onClick={() => navigate(-1)} aria-label="Back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
          </button>
        </div>
        <div className="px-12 pb-10 max-[900px]:px-5" />
      </>
    );
  }

  const bg = imgUrl(show.backdrop_path, 'original');
  const year = itemYear(show);
  const genre = show.genres?.[0]?.name ?? '';
  const rating = show.vote_average ? `★ ${show.vote_average.toFixed(1)}` : '';
  const creator = show.created_by?.map(c => c.name).join(', ') ?? '';
  const cast = show.credits?.cast?.slice(0, 4).map(c => c.name).join(', ') ?? '';

  const tabs: { id: Tab; label: string }[] = [
    { id: 'details', label: 'Details' },
    ...seasons.map((s, i) => ({ id: `season-${i}` as Tab, label: `Season ${s.season_number}` })),
    { id: 'similar', label: 'More like this' },
  ];

  return (
    <>
      <div className="relative w-full aspect-video max-h-[520px] overflow-hidden bg-[#2a2a2a]">
        <div
          style={{
            position: 'absolute', inset: 0,
            ...(bg ? { backgroundImage: `url(${bg})`, backgroundSize: 'cover', backgroundPosition: 'center top' } : { background: '#1e2a3a' })
          }}
        />
        <div className="absolute inset-0" style={{ background: DETAIL_HERO_GRADIENT }} />
        <button className={backBtnCls} onClick={() => navigate(-1)} aria-label="Back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div className="absolute bottom-9 left-12 right-12 max-[900px]:left-6 max-[900px]:right-6 max-[900px]:bottom-6">
          <div className="text-[36px] font-medium mb-[10px] leading-[1.1] max-[900px]:text-2xl">{show.name ?? show.title}</div>
          <div className="flex gap-[10px]">
            <button className="inline-flex items-center gap-[7px] bg-white text-black text-[13px] font-medium py-[9px] px-[22px] rounded-lg border-none cursor-pointer transition-opacity duration-150 hover:opacity-[0.88]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Play S1 E1
            </button>
            <button
              onClick={toggle}
              className="inline-flex items-center gap-[7px] bg-[#2a2a2a] text-[#aaa] text-[13px] font-normal py-[9px] px-5 rounded-lg border-none cursor-pointer transition-colors duration-150 hover:bg-[#333]"
            >
              {inList ? '✓ In list' : '+ My list'}
            </button>
          </div>
        </div>
      </div>

      <div className="px-12 pb-10 max-[900px]:px-5">
        <div className="flex border-b-[0.5px] border-[#2e2e2e] mb-8">
          {tabs.map(t => (
            <button
              key={t.id}
              className={`text-[13px] font-normal py-[14px] mr-7 bg-transparent border-none border-b-2 cursor-pointer transition-colors duration-150 -mb-px ${tab === t.id ? 'text-white border-white' : 'text-[#555] border-transparent hover:text-[#aaa]'}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className={tab === 'details' ? 'block' : 'hidden'}>
          <div className="flex gap-[10px] items-center mb-5 flex-wrap">
            {year && <span className="text-sm font-medium text-white">{year}</span>}
            {year && genre && <span className="text-[#555] text-xs">·</span>}
            {genre && <span className="text-sm font-medium text-white">{genre}</span>}
            {show.number_of_seasons > 0 && (
              <><span className="text-[#555] text-xs">·</span>
              <span className="text-sm font-medium text-white">{show.number_of_seasons} season{show.number_of_seasons !== 1 ? 's' : ''}</span></>
            )}
            {show.number_of_episodes > 0 && (
              <><span className="text-[#555] text-xs">·</span>
              <span className="text-sm font-medium text-white">{show.number_of_episodes} episodes</span></>
            )}
            {rating && <><span className="text-[#555] text-xs">·</span><span className="text-xs text-[#aaa] border-[0.5px] border-[#3a3a3a] rounded-[3px] py-[2px] px-[7px]">{rating}</span></>}
          </div>
          <div className="grid grid-cols-[1fr_200px] gap-10 items-start max-[900px]:grid-cols-1 max-[900px]:gap-6">
            <p className="text-sm text-[#aaa] leading-[1.75]">{show.overview}</p>
            <div className="flex flex-col gap-[18px]">
              {creator && (
                <div>
                  <div className="text-[11px] text-[#555] mb-[3px]">Creator</div>
                  <div className="text-[13px] text-white leading-[1.5]">{creator}</div>
                </div>
              )}
              {cast && (
                <div>
                  <div className="text-[11px] text-[#555] mb-[3px]">Cast</div>
                  <div className="text-[13px] text-white leading-[1.5]">{cast}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {seasons.map((season, i) => (
          <div key={i} className={tab === `season-${i}` ? 'block' : 'hidden'}>
            <div className="flex flex-col">
              {season.episodes.map(ep => <EpisodeRow key={ep.episode_number} episode={ep} />)}
            </div>
          </div>
        ))}

        <div className={tab === 'similar' ? 'block' : 'hidden'}>
          <div className="-mx-12 max-[900px]:-mx-5">
            <ContentRow title="" items={recs} />
          </div>
        </div>
      </div>
    </>
  );
}

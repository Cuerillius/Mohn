import Hero from "../components/Hero";
import ContentRow from "../components/ContentRow";
import GenreChips from "../components/GenreChips";
import useHomeData from "../hooks/useHomeData";

export default function HomePage() {
  const {
    heroItems,
    trending,
    movies,
    tv,
    myList,
    recommended,
    becauseOf,
    topRated,
    continueItems,
    continueExtras,
    watchAgainItems,
  } = useHomeData();

  return (
    <div className="scrollbar-none">
      <Hero items={heroItems} />
      <div className="pt-2 pb-10">
        {continueItems.length > 0 && (
          <ContentRow
            title="Continue Watching"
            items={continueItems}
            itemExtras={continueExtras}
          />
        )}
        {myList.length > 0 && <ContentRow title="My List" items={myList} />}
        {recommended.length > 0 && (
          <ContentRow title="Recommended for You" items={recommended} />
        )}
        {becauseOf && becauseOf.items.length > 0 && (
          <ContentRow title={becauseOf.title} items={becauseOf.items} />
        )}
        <ContentRow title="Trending This Week" items={trending} />
        <ContentRow title="Popular Movies" items={movies} />
        <ContentRow title="Popular Series" items={tv} />
        <GenreChips />
        {topRated.length > 0 && (
          <ContentRow title="Award Winning" items={topRated} />
        )}
        {watchAgainItems.length > 0 && (
          <ContentRow title="Watch It Again" items={watchAgainItems} />
        )}
      </div>
    </div>
  );
}

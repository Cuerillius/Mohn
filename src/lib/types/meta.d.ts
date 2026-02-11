interface Meta {

    selected: {
      metaPath: {
        resource: string;
        type: string;
        id: string;
        extra: any[];
      };
      streamPath: {
        resource: string;
        type: string;
        id: string;
        extra: any[];
      };
      guessStream: boolean;
    };
    metaItem: {
      content: State<{
          id: string;
          type: string;
          name: string;
          poster: string;
          background: string;
          logo: string;
          description: string;
          releaseInfo: string;
          runtime: string;
          released: string;
          posterShape: string;
          links: Array<{
            name: string;
            category: string;
            url: string;
          }>;
          trailerStreams: Array<{
            ytId: string;
            description: string;
            progress: number | null;
            deepLinks: {
              player: string;
              externalPlayer: {
                download: string | null;
                streaming: string | null;
                playlist: string | null;
                fileName: string | null;
                openPlayer: string | null;
                web: string | null;
                androidTv: string | null;
                tizen: string | null;
                webos: string | null;
              };
            };
            lastUsed: string | null;
          }>;
          behaviorHints: {
            defaultVideoId: string;
            featuredVideoId: string | null;
            hasScheduledVideos: boolean;
          };
          videos: any[];
          inLibrary: boolean;
          watched: boolean;
          deepLinks: {
            metaDetailsVideos: string | null;
            metaDetailsStreams: string | null;
            player: string | null;
          };
        }>;
      };
      addon: {
        manifest: {
          id: string;
          name: string;
          logo: string | null;
        };
        transportUrl: string;
    };
    libraryItem: {
      _id: string;
      name: string;
      type: string;
      poster: string;
      posterShape: string;
      removed: boolean;
      temp: boolean;
      _ctime: string;
      _mtime: string;
      state: {
        lastWatched: string;
        timeWatched: number;
        timeOffset: number;
        overallTimeWatched: number;
        timesWatched: number;
        flaggedWatched: number;
        duration: number;
        video_id: string | null;
        watched: string | null;
        noNotif: boolean;
      };
      behaviorHints: {
        defaultVideoId: string;
        featuredVideoId: string | null;
        hasScheduledVideos: boolean;
      };
    };
    streams: Array<{
      content: State<Array<{
          url: string;
          name: string;
          description: string;
          behaviorHints?: {
            bingeGroup?: string;
            filename?: string;
            videoSize?: number;
            notWebReady?: boolean;
            videoHash?: string;
          };
          progress: number | null;
          deepLinks: {
            player: string;
            externalPlayer: {
              download: string | null;
              streaming: string | null;
              playlist: string | null;
              fileName: string | null;
              openPlayer: string | null;
              web: string | null;
              androidTv: string | null;
              tizen: string | null;
              webos: string | null;
            };
          };
          lastUsed: boolean | string | null;
        }>>;
      addon: Addon;
    }>;
    metaExtensions: any[];
    title: string;
    ratingInfo: {
      type: string;
      content: {
        metaId: string;
        status: any | null;
      };
    };
  };
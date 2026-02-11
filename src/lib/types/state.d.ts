type State<T> = {
          type: "Err";
          content: {
            code: number;
            message: string;
          }
        } | {
            type: "Ready" | "Loading";
            content: T;
        }

type Status = 'Ready' | 'Err' | 'Loading';

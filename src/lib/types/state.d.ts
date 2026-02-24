type Loadable<T> =
	| {
			type: 'Err';
			content: {
				code: number;
				message: string;
			};
	  }
	| {
			type: 'Loading';
			content: null;
	  }
	| {
			type: 'Ready';
			content: T;
	  };

type Status = 'Ready' | 'Err' | 'Loading';

import { QueryCache, QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';


export const queryClientInstance = new QueryClient({
	queryCache: new QueryCache({
		onError: (error, query) => {
			if (query.meta?.handledInComponent) return;
			toast.error(error instanceof Error ? error.message : 'Unable to load data. Please try again.');
		},
	}),
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: 1,
		},
	},
});
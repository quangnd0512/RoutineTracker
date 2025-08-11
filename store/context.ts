import { createContext, useContext } from 'react';
import { CandyState } from './candyStore';
import { useStore, StoreApi } from 'zustand';

export const CandyContext = createContext<StoreApi<CandyState> | null>(null);

export function useCandyContext<T>(selector: (state: CandyState) => T): T {
    const store = useContext(CandyContext);
    if (!store) {
        throw new Error('Missing AppContext.Provider in the component tree');
    }

    return useStore(store, selector);
};

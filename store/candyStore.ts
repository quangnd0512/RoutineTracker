import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface CandyProps {
    count: number;
}

export interface CandyState extends CandyProps {
    increment: () => void;
}

export type CandyStore = ReturnType<typeof CreateCandyAppStore>

const CreateCandyAppStore = (initProps?: Partial<CandyProps>) => {
    const defaultProps: CandyProps = {
        count: 0,
    };

    return create<CandyProps & CandyState>()(
        persist(
            (set) => ({
                ...defaultProps,
                ...initProps,
                increment: () => set((prev) => ({ ...prev, count: prev.count + 1 })),
            }),
            {
                name: 'candy-storage',
                storage: createJSONStorage(() => AsyncStorage),
                partialize: (state) => ({
                }),
            }
        )
    );
}

export const candyStore = CreateCandyAppStore();

import { create } from 'zustand';

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

    return create<CandyState & CandyProps>((set) => ({
        ...defaultProps,
        ...initProps,
        increment: () => set((prev) => ({ ...prev, count: prev.count + 1 })),
    }));
}

export const candyStore = CreateCandyAppStore();

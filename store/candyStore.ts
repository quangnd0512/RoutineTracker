import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface RoutineTask {
    id: string;
    label: string;
    isFavorite: boolean;

    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date | null;
}
export interface CandyProps {
    count: number;
    routineTasks: RoutineTask[];
}

export interface CandyState extends CandyProps {
    increment: () => void;
    addRoutineTask: (task: RoutineTask) => void;
    deleteRoutineTask: (taskId: string) => void;
}

export type CandyStore = ReturnType<typeof CreateCandyAppStore>

const CreateCandyAppStore = (initProps?: Partial<CandyProps>) => {
    const defaultProps: CandyProps = {
        count: 0,
        routineTasks: [],
    };

    return create<CandyProps & CandyState>()(
        persist(
            (set) => ({
                ...defaultProps,
                ...initProps,
                increment: () => set((prev) => ({ ...prev, count: prev.count + 1 })),
                addRoutineTask: (task: RoutineTask) =>
                    set((state) => ({
                        routineTasks: [...state.routineTasks, {...task, createdAt: new Date(), updatedAt: new Date(), deletedAt: null}],
                    })),
                deleteRoutineTask: (taskId: string) =>
                    set((state) => ({
                        routineTasks: state.routineTasks.map((task) =>
                            task.id === taskId
                                ? { ...task, deletedAt: new Date() }
                                : task
                        ),
                    }))
            }),
            {
                name: 'candy-storage',
                storage: createJSONStorage(() => AsyncStorage),
                partialize: (state) => ({
                    count: state.count,
                    routineTasks: state.routineTasks.map((task) => ({
                        id: task.id,
                        label: task.label,
                        isFavorite: task.isFavorite,
                        createdAt: task.createdAt,
                        updatedAt: task.updatedAt,
                        deletedAt: task.deletedAt,
                    })),
                }),
            }
        )
    );
}

export const candyStore = CreateCandyAppStore();

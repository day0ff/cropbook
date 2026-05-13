export type ProgressType = {
    type: 'progress';
    data: {
        current: number;
        total: number;
    };
};

export type CompletedType<T> = {
    type: 'completed';
    data: T;
};

export type ProcessingType<T> = ProgressType | CompletedType<T>;
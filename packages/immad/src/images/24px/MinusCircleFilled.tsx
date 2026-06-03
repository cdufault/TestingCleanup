import * as React from 'react';

type Props = {
    minusColor?: string;

    size?: number;
};

export const MinusCircleFilled = ({ minusColor = 'white', size = 24 }: Props) => (
    <svg fill='currentColor' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width={size} height={size}>
        <path d='M12.5 2.2C6.81 2.2 2.2 6.81 2.2 12.5c0 5.692 4.61 10.3 10.3 10.3s10.3-4.608 10.3-10.3c0-5.69-4.61-10.3-10.3-10.3z' />
        <path d='M19 13H6v-1h13v1z' fill={minusColor} />
    </svg>
);

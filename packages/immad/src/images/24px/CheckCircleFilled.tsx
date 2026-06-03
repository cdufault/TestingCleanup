import React from 'react';

type Props = {
    size?: number;
    checkColor?: string;
};

export const CheckCircleFilled = ({ size = 24, checkColor = 'white' }: Props) => (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width={size} height={size} fill='currentColor'>
        <circle cx='12' cy='12' r='10.3' />

        <path d='M10.502 17.277l-3.79-3.585.92-.918 2.865 2.676 7.027-6.874.92.92z' fill={checkColor} />
    </svg>
);

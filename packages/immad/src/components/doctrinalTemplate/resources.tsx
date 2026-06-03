import React from 'react';

const ArrowExpandVerticalIcon = (props: React.SVGProps<SVGSVGElement>): JSX.Element => {
    const { width = '24px', height = '24px', color = 'white', ...restProps } = props;

    return (
        <svg
            xmlns='http://www.w3.org/2000/svg'
            version='1.1'
            width={width}
            height={height}
            viewBox='0 0 24 24'
            {...restProps}
        >
            <path fill={color} d='M13,9V15H16L12,19L8,15H11V9H8L12,5L16,9H13M4,2H20V4H4V2M4,20H20V22H4V20Z' />
        </svg>
    );
};

const ArrowCollapseVerticalIcon = (props: React.SVGProps<SVGSVGElement>): JSX.Element => {
    const { width = '24px', height = '24px', color = 'white', ...restProps } = props;

    return (
        <svg
            xmlns='http://www.w3.org/2000/svg'
            version='1.1'
            width={width}
            height={height}
            viewBox='0 0 24 24'
            {...restProps}
        >
            <path
                fill={color}
                d='M4,12H20V14H4V12M4,9H20V11H4V9M16,4L12,8L8,4H11V1H13V4H16M8,19L12,15L16,19H13V22H11V19H8Z'
            />
        </svg>
    );
};

export { ArrowCollapseVerticalIcon, ArrowExpandVerticalIcon };
